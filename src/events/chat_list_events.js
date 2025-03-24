/**
 * Chat List Events Module
 * Handles events related to the chat list.
 */
const ChatListEventsModule = (function () {
  function handleChatListClick(e) {
    const deleteBtn = e.target.closest(".delete-chat-btn");
    const chatItem = e.target.closest("li");

    if (!chatItem) return;

    const chatId = chatItem.dataset.chatId;

    if (deleteBtn) {
      const chat = ChatModule.getCurrentState().chats.find(
        (c) => c.id === chatId
      );
      ModalModule.showCustomConfirm(
        `Are you sure you want to delete "${chat.name}"? This action cannot be undone.`,
        function (confirmDelete) {
          if (confirmDelete) {
            const state = ChatModule.deleteChat(chatId);
            RenderingModule.renderChatList(state.chats, state.currentChatId);
            RenderingModule.renderConversation(state.conversation);
          }
        }
      );
    } else {
      const result = ChatModule.loadChat(chatId);
      if (result.success) {
        RenderingModule.renderChatList(
          ChatModule.getCurrentState().chats,
          result.currentChatId
        );
        RenderingModule.renderConversation(result.conversation);
        ModelSelectionEventsModule.updateModelAndInstructionSelectors();
      } else {
        ModalModule.showCustomAlert("Chat not found.");
      }
    }
    DocumentsManagerEventsModule.updateDocumentsButtonVisibility();
  }

  function setupEventListeners() {
    const chatListContainer = document.getElementById("chat-list");
    chatListContainer.addEventListener("click", handleChatListClick);
  }

  return {
    setupEventListeners,
  };
})();
