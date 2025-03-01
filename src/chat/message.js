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
  function findWeakModelKey() {
    const allModels = ModelsModule.getModels();
    for (const [key, modelDef] of Object.entries(allModels)) {
      if (modelDef.weak === true) {
        return key;
      }
    }
    return null;
  }
  async function generateChatTitle(userMessage) {
    const models = ModelsModule.getModels();
    const prompt = `${TranslationModule.translate(
      "generateTitlePrompt"
    )} ${userMessage}`;
    const titleMessage = { role: "user", content: prompt };
    const config = ConfigModule.getConfig();
    
    // Get the selected model or default to 'gpt-4o', preferring a weak model if available
    const weakModelKey = findWeakModelKey();
    const selectedModelKey = weakModelKey ? weakModelKey : (config.selectedModelKey || "gpt-4o");
    let selectedModel = models[selectedModelKey];

    // If selectedModel is undefined, fallback to 'gpt-4o'
    if (!selectedModel) {
      console.warn(
        `Selected model "${selectedModelKey}" not found. Using default model "gpt-4o".`
      );
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
      throw new Error(
        `Provider is not defined for model "${selectedModelKey}"`
      );
    }

    const providerConfig = config.providerConfigs[provider] || {};

    // Initialize provider
    const ProviderClass = providers[provider];
    if (!ProviderClass) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    const providerInstance = new ProviderClass();

    // Validate provider configuration
    providerInstance.validateConfig(providerConfig);

    // Prepare messages using the provider's method
    const preparedMessages = providerInstance.prepareMessages([titleMessage]);

    // Prepare model options
    const modelOptions = {
      temperature: selectedModel.temperature || 0.7,
    };

    // Call the API using the provider instance
    const apiResponse = await providerInstance.fetchChatCompletion(
      preparedMessages,
      titleDeployment,
      modelOptions,
      providerConfig
    );

    return apiResponse.content.trim().replace(/[\n\r]/g, "");
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

    // Get and clear any pending uploaded files
    const attachedFiles = FileUploadEventsModule.getAndClearPendingFiles();
    console.log("Attached Files:", attachedFiles);
    
    const currentState = ChatModule.getCurrentState();
    const newMessage = { 
      role: "user", 
      content: messageContent,
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
    };
    currentState.conversation.push(newMessage);

    RenderingModule.renderConversation(currentState.conversation);
    MessageModule.saveConversation(
      currentState.currentChatId,
      currentState.conversation
    );

    // Update lastUpdated after adding user message
    ChatModule.updateChatLastUpdated(currentState.currentChatId);

    // Retrieve selected model parameters from current chat
    const currentChat = ChatModule.getCurrentChat();
    const selectedModelKey = currentChat.selectedModelKey || "gpt-4o";
    const selectedModelParams = ModelsModule.getModel(selectedModelKey);
    const deploymentName = selectedModelParams.deployment;

    // Get the provider and config
    const provider = selectedModelParams.provider;
    const providerConfig = config.providerConfigs[provider] || {};

    // Initialize provider
    const ProviderClass = providers[provider];
    if (!ProviderClass) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    const providerInstance = new ProviderClass();

    // Validate provider configuration
    providerInstance.validateConfig(providerConfig);

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
    }

    // Conditionally merge attached file contents into user messages, skipping ignored files.
    conversationToSend = conversationToSend.map(msg => {
      if (msg.role === "user" && Array.isArray(msg.attachedFiles) && msg.attachedFiles.length > 0) {
        let mergedContent = "";
        console.log("Merging attached files for message. Count:", msg.attachedFiles.length);
        msg.attachedFiles.forEach(file => {
          if (!file.ignored) {  // Only merge if not ignored
            console.log("Merging file:", file.fileName);
            // Normalize newlines to LF for consistency
            const normalizedContent = file.content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
            mergedContent += `${file.fileName}\n\n${normalizedContent}\n\n----------\n`;
          } else {
            console.log("Skipping ignored file:", file.fileName);
          }
        });
        mergedContent += msg.content;
        console.log("Resulting merged content:", mergedContent);
        return { ...msg, content: mergedContent };
      }
      return msg;
    });
      
    // Prepare the messages normally:
    if (selectedModelParams && selectedModelParams.system) {
      // Prepare messages using the provider's method with instruction
      conversationToSend = providerInstance.prepareMessages(
        conversationToSend,
        instruction
      );
    } else {
      // Even if the model doesn't support system messages,
      // we might still need to prepare messages
      conversationToSend = providerInstance.prepareMessages(conversationToSend);
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

      // Call the API directly on the provider instance
      console.log("Sending request with:", {
        conversationToSend,
        deploymentName,
        modelOptions,
        providerConfig,
      });

      const apiResponse = await providerInstance.fetchChatCompletion(
        conversationToSend,
        deploymentName,
        modelOptions,
        providerConfig
      );

      // Now log the response after it's been initialized
      console.log("apiResponse:", apiResponse);
      console.log(
        "apiResponse.content:",
        apiResponse.content,
        "Type:",
        typeof apiResponse.content
      );

      currentState.conversation[currentState.conversation.length - 1] = {
        role: "assistant",
        content:
          typeof apiResponse.content === "string"
            ? apiResponse.content
            : apiResponse.content.raw ||
              apiResponse.content.text ||
              JSON.stringify(apiResponse.content),
        model: selectedModelKey,
        instructionLabel: instructionLabel,
        usage: apiResponse.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      };

      RenderingModule.renderConversation(currentState.conversation);
      MessageModule.saveConversation(
        currentState.currentChatId,
        currentState.conversation
      );
      // Re-check token usage right after the new assistant message is added
      InputEventsModule.checkTokenWarning();

      // Update lastUpdated after receiving assistant's response
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
