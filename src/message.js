/**
 * Message Module
 * Handles message creation, processing, and conversation management.
 */
const MessageModule = (function () {
  async function generateChatTitle(userMessage) {
    const models = ModelsModule.getModels();
    const prompt = `${TranslationModule.translate('generateTitlePrompt')} ${userMessage}`;
    const titleMessage = { role: "user", content: prompt };
    const config = ConfigModule.getConfig();
    // Get the selected model or default to 'gpt-4o'
    const selectedModelKey = config.selectedModelKey || "gpt-4o";
    const selectedModel = models[selectedModelKey];

    // Use the titleDeployment from config or default to the selected model's deployment
    const titleDeployment = config.titleDeployment || selectedModel.deployment;

    // Get provider and config
    const provider = selectedModel.provider;
    const providerConfig = config.providerConfigs[provider] || {};

    const response = await ApiModule.fetchChatCompletion(
      [titleMessage],
      titleDeployment,
      {}, // options
      "", // systemMessageContent
      provider,
      providerConfig
    );

    if (response.error) {
      console.error(`Error generating chat title: ${response.message}`);
      throw new Error(response.message);
    } else {
      return response.message.content.trim().replace(/[\n\r]/g, "");
    }
  }

  function saveConversation(chatId, conversation) {
    const chat = ChatModule.getCurrentChat();
    if (chat) {
      chat.conversation = conversation;
      StorageModule.saveData("chats", ChatModule.getCurrentState().chats);
    }
  }

  return {
    generateChatTitle,
    saveConversation,
  };
})();
