/**
 * Message Module
 * Handles message creation, processing, and conversation management.
 */
var MessageModule = (function() {
    async function generateChatTitle(userMessage) {
        const prompt = `Provide a short (maximum 5 words) and descriptive chat title based on the following message:\n"${userMessage}"`;
        const titleMessage = { role: "user", content: prompt };
        const response = await ApiModule.fetchChatCompletion(
            [titleMessage],
            ConfigModule.getConfig().titleDeployment
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
