/**
 * Chat Module
 * Handles chat management including creation, loading, and deletion of chats.
 */
var ChatModule = (function() {
    // Private variables
    let chats = JSON.parse(localStorage.getItem("chats")) || [];
    let currentChatId = localStorage.getItem("currentChatId");
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
        return { success: false };
    }

    function saveChats() {
        localStorage.setItem("chats", JSON.stringify(chats));
    }

    function saveCurrentChatId() {
        localStorage.setItem("currentChatId", currentChatId);
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
            return loadChat(currentChatId);
        } else {
            return loadChat(chats[0].id);
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
