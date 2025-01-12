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
        // Check for existing empty "New chat"s
        const emptyNewChats = chats.filter(
            (chat) => chat.name === "New chat" && chat.conversation.length === 0
        );
        if (emptyNewChats.length > 0) {
            // Find the most recently updated empty "New chat"
            const existingEmptyNewChat = emptyNewChats.reduce((latestChat, chat) => {
                return chat.lastUpdated > latestChat.lastUpdated ? chat : latestChat;
            }, emptyNewChats[0]);

            // Update 'lastUpdated' to move it to the top
            existingEmptyNewChat.lastUpdated = Date.now();
            currentChatId = existingEmptyNewChat.id;
            conversation = existingEmptyNewChat.conversation;
            saveChats();
            saveCurrentChatId();
            return getCurrentState();
        }

        const config = ConfigModule.getConfig();
        const chatId = Date.now().toString();
        const chat = {
            id: chatId,
            name: "New chat",
            conversation: [],
            selectedModelKey: config.lastUsedModelKey || 'gpt-4o',
            selectedInstructionId: config.lastUsedInstructionId || instructions[0].id,
            lastUpdated: Date.now(),
        };
        chats.push(chat);
        currentChatId = chatId;
        conversation = chat.conversation;
        saveChats();
        saveCurrentChatId();
        return getCurrentState();
    }

    function loadChat(chatId) {
        currentChatId = chatId;
        const chat = chats.find((c) => c.id === chatId);
        if (chat) {
            conversation = chat.conversation;
            // Update selected model and instruction in config
            ConfigModule.updateConfig({
                selectedModelKey: chat.selectedModelKey,
                selectedInstructionId: chat.selectedInstructionId,
            });
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
        if (chats.length <= 1) {
            // Prevent deleting the last chat
            ModalModule.showCustomAlert('Cannot delete the last remaining chat.');
            return {
                chats,
                currentChatId,
                conversation,
            };
        }

        chats = chats.filter((chat) => chat.id !== chatId);
        saveChats(); // Save changes to storage

        if (currentChatId === chatId) {
            if (chats.length > 0) {
                return loadChat(chats[0].id);
            } else {
                // This condition should not occur as we prevent deleting the last chat
                return createNewChat();
            }
        }

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
            chat.lastUpdated = Date.now();
            saveChats();
        }
    }

    function updateChatLastUpdated(chatId) {
        const chat = chats.find((c) => c.id === chatId);
        if (chat) {
            chat.lastUpdated = Date.now();
            saveChats();
        }
    }

    function getCurrentState() {
        // Sort chats to ensure empty "New chat" is at top, then by lastUpdated
        chats.sort((a, b) => {
            // If 'a' is the empty "New chat", place it at the top
            if (a.name === 'New chat' && a.conversation.length === 0) return -1;
            // If 'b' is the empty "New chat", place 'a' after 'b'
            if (b.name === 'New chat' && b.conversation.length === 0) return 1;
            // Otherwise, sort by 'lastUpdated' descending
            return b.lastUpdated - a.lastUpdated;
        });
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
            } else {
                // No empty "New chat" exists, create one
                return createNewChat();
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
        updateChatLastUpdated,
        getCurrentState,
        saveChats,
    };
})();
