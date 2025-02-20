/**
 * Event Module
 * Coordinates event listener modules.
 */
const EventModule = (function () {
  function setupEventListeners() {
    // Mobile menu toggle
    const navbarBurger = document.querySelector(".navbar-burger");
    navbarBurger.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebarMenu");
      sidebar.classList.toggle("is-active");
    });

    // New chat button
    const newChatBtn = document.getElementById("new-chat-btn");
    newChatBtn.addEventListener("click", function () {
      const state = ChatModule.createNewChat();
      RenderingModule.renderChatList(state.chats, state.currentChatId);
      RenderingModule.renderConversation(state.conversation);
      ModelSelectionEventsModule.updateModelAndInstructionSelectors();
    });

    // Initialize event modules
    InputEventsModule.setupEventListeners();
    ChatListEventsModule.setupEventListeners();
    SettingsEventsModule.setupEventListeners();
    InstructionEventsModule.setupEventListeners();
    ModelSelectionEventsModule.setupEventListeners();
    FileUploadEventsModule.setupEventListeners();
  }

  return {
    setupEventListeners,
  };
})();
