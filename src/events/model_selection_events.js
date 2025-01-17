/**
 * Model Selection Events Module
 * Handles events related to model selection and updates.
 */
const ModelSelectionEventsModule = (function () {
  function updateModelAndInstructionSelectors() {
    const models = ModelsModule.getModels();
    const modelSelect = document.getElementById("model-select");
    const instructionsSelect = document.getElementById("instructions-select");

    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();

    if (currentChat) {
      modelSelect.value = currentChat.selectedModelKey || config.selectedModelKey || "gpt-4o";
      instructionsSelect.value = currentChat.selectedInstructionId || config.selectedInstructionId || instructions[0].id;
    } else {
      modelSelect.value = config.selectedModelKey || "gpt-4o";
      instructionsSelect.value = config.selectedInstructionId || instructions[0].id;
    }
    updateInstructionsVisibility();
  }

  function updateInstructionsVisibility() {
    const models = ModelsModule.getModels();
    const config = ConfigModule.getConfig();
    const currentModelKey = config.selectedModelKey || "gpt-4o";
    const selectedModelParams = models[currentModelKey];
    const instructionsGroup = document.getElementById("instructions-group");

    if (!selectedModelParams) {
      instructionsGroup.style.display = "none";
      return;
    }

    instructionsGroup.style.display = selectedModelParams.system ? "flex" : "none";
  }

  function setupEventListeners() {
    const modelSelect = document.getElementById("model-select");
    
    modelSelect.addEventListener("change", function () {
      const newModelKey = this.value;
      ConfigModule.updateConfig({ selectedModelKey: newModelKey });
      const currentChat = ChatModule.getCurrentChat();
      if (currentChat) {
        currentChat.selectedModelKey = newModelKey;
        ChatModule.saveChats();
      }
      updateInstructionsVisibility();
    });
  }

  return {
    updateModelAndInstructionSelectors,
    updateInstructionsVisibility,
    setupEventListeners,
  };
})();
