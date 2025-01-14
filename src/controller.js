/**
 * Controller Module
 * Coordinates interactions between modules and manages application flow.
 */
const ControllerModule = (function () {
  const models = ModelsModule.getModels(); // Retrieve models

  function cleanUpLocalStorage() {
    ["selectedModelKey", "selectedInstructionId"].forEach((key) => {
      const value = localStorage.getItem(key);
      if (value === "undefined" || value === undefined || value === null) {
        localStorage.removeItem(key);
      }
    });
  }

  async function initializeApp() {
    await ConfigModule.initialize();
    await TranslationModule.initialize();

    // Set language for TranslationModule
    TranslationModule.setLanguage(ConfigModule.getConfig().language);

    // Apply translations to UI
    TranslationModule.applyTranslations();

    cleanUpLocalStorage(); // Clean up invalid localStorage entries
    const state = ChatModule.initialize();
    RenderingModule.renderChatList(state.chats, state.currentChatId);
    RenderingModule.renderConversation(state.conversation);
    EventModule.setupEventListeners(); // All event listeners are now initialized here
  }

  async function sendMessage(messageContent) {
    const config = ConfigModule.getConfig();
    if (!config.endpoint || !config.apiKey) {
      throw new Error("Configuration not set");
    }

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
      // Prepend system message to conversationToSend
      conversationToSend.unshift({
        role: "system",
        content: instruction.content,
      });
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
        modelOptions
      );

      if (apiResponse.error) {
        // Remove loading message
        currentState.conversation.pop();
        RenderingModule.renderConversation(currentState.conversation);
        // Show an error message to the user
        ModalModule.showCustomAlert(apiResponse.message);
      } else {
        currentState.conversation[currentState.conversation.length - 1] = {
          ...apiResponse.message,
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
        if (chat.name === "Ny chat") {
          try {
            const title = await MessageModule.generateChatTitle(messageContent);
            ChatModule.updateChatTitle(chat.id, title);
            RenderingModule.renderChatList(
              ChatModule.getCurrentState().chats,
              currentState.currentChatId
            );
          } catch (error) {
            console.error("Error generating chat title:", error);
            ChatModule.updateChatTitle(chat.id, "Ny chat");
            RenderingModule.renderChatList(
              ChatModule.getCurrentState().chats,
              currentState.currentChatId
            );
          }
        }
      }
    } catch (error) {
      // Remove loading message
      currentState.conversation.pop();
      RenderingModule.renderConversation(currentState.conversation);
      // Show error message to the user
      ModalModule.showCustomAlert(`Ett fel uppstod: ${error.message}`);
      console.error("Error during sendMessage:", error);
    }
  }

  return {
    initializeApp,
    sendMessage,
  };
})();
