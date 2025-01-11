/**
 * Controller Module
 * Coordinates interactions between modules and manages application flow.
 */
const ControllerModule = (function () {
  function initializeApp() {
    const state = ChatModule.initialize();
    RenderingModule.renderChatList(state.chats, state.currentChatId);
    RenderingModule.renderConversation(state.conversation);
    EventModule.setupEventListeners(); // Called once here
    ThemeModule.applyTheme(ThemeModule.getCurrentTheme());
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

    // Retrieve selected model parameters
    const selectedModelKey = config.selectedModelKey || "gpt-4o";
    const selectedModelParams = models[selectedModelKey];
    const deploymentName = selectedModelParams.deployment;

    // Start with a copy of the conversation WITHOUT the loading message
    let conversationToSend = [...currentState.conversation];
    let instructionLabel = "";

    // Handle system message if the model supports it
    if (selectedModelParams && selectedModelParams.system) {
      // Get latest instruction ID and custom instructions
      const selectedInstructionId = localStorage.getItem("selectedInstructionId") || instructions[0].id;
      const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];

      // Find selected instruction
      let instruction = customInstructions.find(instr => instr.id === selectedInstructionId) ||
                       instructions.find(instr => instr.id === selectedInstructionId);

      if (!instruction) {
        instruction = instructions[0]; // Fallback to default instruction
      }

      instructionLabel = instruction.label;
      // Prepend system message to conversationToSend
      conversationToSend.unshift({ role: "system", content: instruction.content });
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
      const response = await ApiModule.fetchChatCompletion(
        conversationToSend,
        deploymentName,
        modelOptions
      );

      currentState.conversation[currentState.conversation.length - 1] = {
        ...response,
        model: selectedModelKey,
        instructionLabel: instructionLabel
      };

      RenderingModule.renderConversation(currentState.conversation);
      MessageModule.saveConversation(
        currentState.currentChatId,
        currentState.conversation
      );

      const chat = ChatModule.getCurrentChat();
      if (chat.name === "New chat") {
        const title = await MessageModule.generateChatTitle(messageContent);
        ChatModule.updateChatTitle(chat.id, title);
        RenderingModule.renderChatList(
          ChatModule.getCurrentState().chats,
          currentState.currentChatId
        );
      }
    } catch (error) {
      currentState.conversation.pop(); // Remove loading message
      RenderingModule.renderConversation(currentState.conversation);
      throw error;
    }
  }

  return {
    initializeApp,
    sendMessage,
  };
})();
