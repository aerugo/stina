/**
 * Message Module
 * Handles message creation, processing, and conversation management.
 */
const MessageModule = (function () {
  const providers = {
    azure: AzureProvider,
    openai: OpenAIProvider,
    anthropic: AnthropicProvider,
    ollama: OllamaProvider,
  };
  async function generateChatTitle(userMessage) {
    const models = ModelsModule.getModels();
    const prompt = `${TranslationModule.translate(
      "generateTitlePrompt"
    )} ${userMessage}`;
    const titleMessage = { role: "user", content: prompt };
    const config = ConfigModule.getConfig();

    // Get the selected model or default to 'gpt-4o'
    const selectedModelKey = config.selectedModelKey || "gpt-4o";
    let selectedModel = models[selectedModelKey];

    // If selectedModel is undefined, fallback to 'gpt-4o'
    if (!selectedModel) {
      console.warn(`Selected model "${selectedModelKey}" not found. Using default model "gpt-4o".`);
      selectedModel = models["gpt-4o"];
    }

    if (!selectedModel) {
      throw new Error("No valid model found for generating title");
    }

    // Use the titleDeployment from config or default to the selected model's deployment
    const titleDeployment = config.titleDeployment || selectedModel.deployment;

    // Get provider and config
    const provider = selectedModel.provider;
    if (!provider) {
      throw new Error(`Provider is not defined for model "${selectedModelKey}"`);
    }

    const providerConfig = config.providerConfigs[provider] || {};

    const response = await ApiModule.fetchChatCompletion(
      [titleMessage],
      titleDeployment,
      {}, // options
      provider,
      providerConfig
    );

    return response.content.trim().replace(/[\n\r]/g, "");
  }

  function saveConversation(chatId, conversation) {
    const chat = ChatModule.getCurrentChat();
    if (chat) {
      chat.conversation = conversation;
      StorageModule.saveData("chats", ChatModule.getCurrentState().chats);
    }
  }

  async function sendMessage(messageContent) {
    const config = ConfigModule.getConfig();

    const currentState = ChatModule.getCurrentState();
    const newMessage = { role: "user", content: messageContent };
    currentState.conversation.push(newMessage);

    RenderingModule.renderConversation(currentState.conversation);
    MessageModule.saveConversation(
      currentState.currentChatId,
      currentState.conversation
    );

    // Retrieve selected model parameters from current chat
    const currentChat = ChatModule.getCurrentChat();
    const selectedModelKey = currentChat.selectedModelKey || "gpt-4o";
    const selectedModelParams = ModelsModule.getModel(selectedModelKey);
    const deploymentName = selectedModelParams.deployment;

    // Get the provider and config
    const provider = selectedModelParams.provider;
    const providerConfig = config.providerConfigs[provider] || {};

    // Start with a copy of the conversation WITHOUT the loading message
    let conversationToSend = [...currentState.conversation];
    let instructionLabel = "";
    // Handle system message if the model supports it
    if (selectedModelParams && selectedModelParams.system) {
      // Get latest instruction ID and custom instructions
      const selectedInstructionId =
        currentChat.selectedInstructionId || instructions[0].id;
      const customInstructions =
        JSON.parse(localStorage.getItem("customInstructions")) || [];

      // Find selected instruction
      let instruction =
        customInstructions.find(
          (instr) => instr.id === selectedInstructionId
        ) || instructions.find((instr) => instr.id === selectedInstructionId);

      if (!instruction) {
        instruction = instructions[0]; // Fallback to default instruction
      }

      instructionLabel = instruction.label;

      // Initialize provider
      const ProviderClass = providers[provider];
      if (!ProviderClass) {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      const providerInstance = new ProviderClass();

      // Validate provider configuration
      providerInstance.validateConfig(providerConfig);

      // Prepare messages using the provider's method
      conversationToSend = providerInstance.prepareMessages(conversationToSend, instruction);
    }

    const loadingMessage = { role: "assistant", content: "", isLoading: true };
    currentState.conversation.push(loadingMessage);
    RenderingModule.renderConversation(currentState.conversation);

    try {
      // Prepare model options
      const modelOptions = {
        max_tokens: selectedModelParams.max_tokens,
        temperature: selectedModelParams.temperature,
        top_p: selectedModelParams.top_p,
        frequency_penalty: selectedModelParams.frequency_penalty,
        presence_penalty: selectedModelParams.presence_penalty,
        stop: selectedModelParams.stop,
      };

      // Call the API with the correct deployment name and options
      const apiResponse = await ApiModule.fetchChatCompletion(
        conversationToSend,
        deploymentName,
        modelOptions,
        provider,
        providerConfig
      );

      currentState.conversation[currentState.conversation.length - 1] = {
        ...apiResponse,
        model: selectedModelKey,
        instructionLabel: instructionLabel,
      };

      RenderingModule.renderConversation(currentState.conversation);
      MessageModule.saveConversation(
        currentState.currentChatId,
        currentState.conversation
      );

      // Update the lastUpdated timestamp
      ChatModule.updateChatLastUpdated(currentState.currentChatId);

      const chat = ChatModule.getCurrentChat();
      if (chat.isNewChat) {
        try {
          const title = await MessageModule.generateChatTitle(messageContent);
          ChatModule.updateChatTitle(chat.id, title);
        } catch (error) {
          console.error(
            TranslationModule.translate("errorGeneratingTitle"),
            error
          );
          ChatModule.updateChatTitle(
            chat.id,
            TranslationModule.translate("newChat")
          );
        }
        // Set isNewChat to false after title has been updated
        chat.isNewChat = false;
        ChatModule.saveChats();

        // Render chat list after updating isNewChat
        RenderingModule.renderChatList(
          ChatModule.getCurrentState().chats,
          currentState.currentChatId
        );
      }
    } catch (error) {
      // Remove loading message
      currentState.conversation.pop();
      RenderingModule.renderConversation(currentState.conversation);
      // Show error message to the user
      ModalModule.showCustomAlert(
        `${TranslationModule.translate("errorSendingMessage")} ${error.message}`
      );
      console.error("Error during sendMessage:", error);
    }
  }

  return {
    generateChatTitle,
    saveConversation,
    sendMessage,
  };
})();
