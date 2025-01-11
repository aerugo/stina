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
        // If chat not found, create a new chat
        return createNewChat();
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
            return createNewChat();
        } else if (currentChatId) {
            const result = loadChat(currentChatId);
            if (result.success) {
                return result;
            } else {
                // If loading current chat fails, create new chat
                return createNewChat();
            }
        } else {
            const result = loadChat(chats[0].id);
            if (result.success) {
                return result;
            } else {
                // If loading the first chat fails, create new chat
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
