/**
 * Chat Module
 * Handles chat management including creation, loading, and deletion of chats.
 */
var ChatModule = (function() {
    // Private variables
    let chats = StorageModule.loadData("chats") || [];
    let currentChatId = StorageModule.loadData("currentChatId");
    let conversation = [];

    function createNewChat() {
        const chatId = Date.now().toString();
        const chat = {
            id: chatId,
            name: "New chat",
            conversation: [],
        };
        chats.push(chat);
        currentChatId = chatId;
        conversation = chat.conversation;
        saveChats();
        saveCurrentChatId();
        return {
            chats,
            currentChatId,
            conversation,
        };
    }

    function loadChat(chatId) {
        currentChatId = chatId;
        const chat = chats.find((c) => c.id === chatId);
        if (chat) {
            conversation = chat.conversation;
            saveCurrentChatId();
            return {
                chats,
                conversation,
                currentChatId,
                success: true,
            };
        }
        // If chat not found, return failure
        return { success: false };
    }

    function saveChats() {
        StorageModule.saveData("chats", chats);
    }

    function saveCurrentChatId() {
        StorageModule.saveData("currentChatId", currentChatId);
    }

    function deleteChat(chatId) {
        chats = chats.filter((chat) => chat.id !== chatId);
        if (currentChatId === chatId) {
            if (chats.length > 0) {
                return loadChat(chats[0].id);
            } else {
                return createNewChat();
            }
        }
        saveChats();
        return {
            chats,
            currentChatId,
            conversation,
        };
    }

    function getCurrentChat() {
        return chats.find((c) => c.id === currentChatId);
    }

    function updateChatTitle(chatId, newTitle) {
        const chat = chats.find((c) => c.id === chatId);
        if (chat) {
            chat.name = newTitle || "New chat";
            saveChats();
        }
    }

    function getCurrentState() {
        return {
            chats,
            currentChatId,
            conversation,
        };
    }

    function initialize() {
        if (chats.length === 0) {
            // No chats exist, create a new one
            return createNewChat();
        } else {
            // Check for an existing empty "New chat"
            const emptyNewChat = chats.find(chat => chat.name === 'New chat' && chat.conversation.length === 0);
            if (emptyNewChat) {
                // Load the existing empty "New chat"
                const result = loadChat(emptyNewChat.id);
                if (result.success) {
                    return result;
                }
            }

            if (currentChatId) {
                // Try to load the chat with currentChatId
                const result = loadChat(currentChatId);
                if (result.success) {
                    return result;
                }
            }

            // Try to load the first chat in the list
            const result = loadChat(chats[0].id);
            if (result.success) {
                return result;
            } else {
                // First chat not found, create a new chat
                return createNewChat();
            }
        }
    }

    return {
        initialize,
        createNewChat,
        loadChat,
        deleteChat,
        getCurrentChat,
        updateChatTitle,
        getCurrentState,
    };
})();
