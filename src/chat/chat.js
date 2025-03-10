/**
 * Chat Module
 * Handles chat management including creation, loading, and deletion of chats.
 */
const ChatModule = (function () {
  // Global mapping for attachment ignore state (applies to both pending and older attachments)
  let ignoredAttachments = {}; 
  
  function clearIgnoredAttachments() {
    ignoredAttachments = {};
  }
  
  // Private variables
  let chats = [];
  let currentChatId;
  let conversation = [];

  function createNewChat() {
    const models = ModelsModule.getModels();

    // Check for existing empty new chats
    const emptyNewChats = chats.filter(
      (chat) => chat.isNewChat && chat.conversation.length === 0
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
    const selectedModelKey = config.lastUsedModelKey || "gpt-4o";
    const selectedModel = models[selectedModelKey];

    let selectedInstructionId;
    if (selectedModel && selectedModel.system !== false) {
      // Model supports instructions
      // Find the instruction with the lowest 'order' property
      const instructionWithLowestOrder = instructions.reduce((prev, curr) => {
        return prev.order < curr.order ? prev : curr;
      });
      selectedInstructionId = instructionWithLowestOrder.id;
    } else {
      // Model doesn't support instructions
      selectedInstructionId = null;
    }

    const chatId = Date.now().toString();
    const chat = {
      id: chatId,
      name: TranslationModule.translate("newChat"),
      conversation: [],
      selectedModelKey: selectedModelKey,
      selectedInstructionId: selectedInstructionId,
      lastUpdated: Date.now(),
      isNewChat: true,
    };
    chats.push(chat);
    currentChatId = chatId;
    conversation = chat.conversation;
    ModelSelectionEventsModule.resetClearanceNoticeDismissed();
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
      
      // Update model dropdown to reflect document classification requirements
      if (typeof ModelSelectionEventsModule !== 'undefined') {
        setTimeout(() => ModelSelectionEventsModule.populateModelDropdown(), 0);
      }
      
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
      ModalModule.showCustomAlert(
        TranslationModule.translate("cannotDeleteLastChat")
      );
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
      const defaultTitle = TranslationModule.translate("newChat");
      chat.name = newTitle || defaultTitle;
      chat.lastUpdated = Date.now();
      // Unset isNewChat flag if the title is different from the default
      if (chat.name !== defaultTitle) {
        chat.isNewChat = false;
      }
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

  /**
   * Replaces all existing chats with the provided array.
   * Updates currentChatId and conversation accordingly.
   */
  function importChats(newChats) {
    if (!Array.isArray(newChats)) return;
    // Merge new chats into existing chats
    chats = chats.concat(newChats);
    // Update currentChatId and conversation if necessary
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (currentChat) {
      conversation = currentChat.conversation;
    } else if (chats.length > 0) {
      currentChatId = chats[0].id;
      conversation = chats[0].conversation;
    } else {
      currentChatId = null;
      conversation = [];
    }
    saveChats();
    saveCurrentChatId();
  }

  function getCurrentState() {
    // Sort chats to ensure empty new chats at the top, then by lastUpdated
    chats.sort((a, b) => {
      // If 'a' is an empty new chat, place it before 'b'
      const aIsEmptyNewChat = a.isNewChat && a.conversation.length === 0;
      const bIsEmptyNewChat = b.isNewChat && b.conversation.length === 0;
      if (aIsEmptyNewChat && !bIsEmptyNewChat) return -1;
      if (!aIsEmptyNewChat && bIsEmptyNewChat) return 1;
      if (aIsEmptyNewChat && bIsEmptyNewChat) return 0;

      // Otherwise, sort by 'lastUpdated' descending
      return b.lastUpdated - a.lastUpdated;
    });
    return {
      chats,
      currentChatId,
      conversation,
    };
  }

  async function initialize() {
    chats = (await StorageModule.loadData("chats")) || [];
    currentChatId = await StorageModule.loadData("currentChatId");
    
    if (chats.length === 0) {
      // No chats exist, create a new one
      return createNewChat();
    } else {
      // Check for an existing empty "New chat"
      const emptyNewChat = chats.find(
        (chat) => chat.isNewChat && chat.conversation.length === 0
      );
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
    importChats,
    ignoredAttachments,
    clearIgnoredAttachments
  };
})();
