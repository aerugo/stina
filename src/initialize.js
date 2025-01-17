/**
 * Controller Module
 * Coordinates interactions between modules and manages application flow.
 */
const InitializationModule = (function () {
  function cleanUpLocalStorage() {
    ["selectedModelKey", "selectedInstructionId"].forEach((key) => {
      const value = localStorage.getItem(key);
      if (value === "undefined" || value === undefined || value === null) {
        localStorage.removeItem(key);
      }
    });
  }

  function initializeApp() {
    ConfigModule.initialize();
    TranslationModule.initialize();

    // Set language for TranslationModule
    TranslationModule.setLanguage(ConfigModule.getConfig().language);

    // Apply translations to UI
    TranslationModule.applyTranslations();

    // Set placeholder for user input
    const userInput = document.getElementById("user-input");
    userInput.setAttribute(
      "data-placeholder",
      TranslationModule.translate("writeToAssistantPlaceholder")
    );

    cleanUpLocalStorage(); // Clean up invalid localStorage entries
    const state = ChatModule.initialize();
    RenderingModule.renderChatList(state.chats, state.currentChatId);
    RenderingModule.renderConversation(state.conversation);
    EventModule.setupEventListeners(); // Initialize all event modules
    ModelSelectionEventsModule.updateModelAndInstructionSelectors(); // Update selectors after initialization
  }

  return {
    initializeApp,
  };
})();
