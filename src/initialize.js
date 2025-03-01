/**
 * Controller Module
 * Coordinates interactions between modules and manages application flow.
 */
const InitializationModule = (function () {
  async function initializeApp() {
    console.log("Initializing application...");

    // Show loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "app-loading-indicator";
    loadingIndicator.className = "app-loading";
    loadingIndicator.innerHTML = "<span>Loading application...</span>";
    document.body.appendChild(loadingIndicator);

    try {
      await ConfigModule.initialize();
      TranslationModule.initialize();

      // Set language for TranslationModule
      const config = await ConfigModule.getConfig();
      TranslationModule.setLanguage(config.language);

      // Apply translations to UI
      TranslationModule.applyTranslations();

      // Set placeholder for user input
      const userInput = document.getElementById("user-input");
      if (userInput) {
        userInput.setAttribute(
          "data-placeholder",
          TranslationModule.translate("writeToAssistantPlaceholder")
        );
      }

      const state = await ChatModule.initialize();
      RenderingModule.renderChatList(state.chats, state.currentChatId);
      RenderingModule.renderConversation(state.conversation);
      EventModule.setupEventListeners(); // Initialize all event modules
      await ModelSelectionEventsModule.populateModelSelector(); // Populate model selector
      await ModelSelectionEventsModule.updateModelAndInstructionSelectors(); // Update selectors after initialization
      
      // Debug information about models and instructions
      console.log("Available models:", ModelsModule.getModels());
      console.log("Selected model:", ConfigModule.getConfig().selectedModelKey);
      console.log("Available instructions:", window.instructions);
      console.log("Selected instruction:", ConfigModule.getConfig().selectedInstructionId);
      
      // Force update of instruction visibility
      ModelSelectionEventsModule.updateInstructionsVisibility();
      
      console.log("Application initialization complete");
    } catch (error) {
      console.error("Error during application initialization:", error);
      // Show error message
      const errorDiv = document.createElement("div");
      errorDiv.className = "initialization-error";
      errorDiv.textContent =
        "Failed to initialize application. Please refresh the page.";
      document.body.appendChild(errorDiv);
    } finally {
      // Remove loading indicator
      const indicator = document.getElementById("app-loading-indicator");
      if (indicator) {
        indicator.remove();
      }
    }
  }

  return {
    initializeApp,
  };
})();
