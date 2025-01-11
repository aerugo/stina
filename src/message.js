/**
 * Message Module
 * Handles message creation, processing, and conversation management.
 */
var MessageModule = (function() {
    const models = ModelsModule.getModels(); // Retrieve models

    async function generateChatTitle(userMessage) {
        const prompt = `Provide a short (maximum 5 words) and descriptive chat title based on the following message:\n"${userMessage}"`;
        const titleMessage = { role: "user", content: prompt };
        const config = ConfigModule.getConfig();
        // Get the selected model or default to 'gpt-4o'
        const selectedModelKey = config.selectedModelKey || 'gpt-4o';
        const selectedModel = models[selectedModelKey];

        // Use the titleDeployment from config or default to the selected model's deployment
        const titleDeployment = config.titleDeployment || selectedModel.deployment;

        const response = await ApiModule.fetchChatCompletion(
            [titleMessage],
            titleDeployment
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

    return {
        generateChatTitle,
        saveConversation
    };
})();
