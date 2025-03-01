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
      console.warn(`Model with key "${currentModelKey}" not found in models:`, models);
      instructionsGroup.style.display = "none";
      return;
    }

    // Default to showing instructions if system property is undefined or true
    const shouldShowInstructions = selectedModelParams.system !== false;
    console.log(`Model ${currentModelKey} system property:`, selectedModelParams.system, 
                `Showing instructions: ${shouldShowInstructions}`);
    
    instructionsGroup.style.display = shouldShowInstructions ? "flex" : "none";
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
      // Ensure instruction visibility is updated
      setTimeout(() => {
        updateInstructionsVisibility();
        console.log("Model changed to:", newModelKey, "- Updated instruction visibility");
      }, 0);
    });
  }

  function populateModelSelector() {
    const models = ModelsModule.getModels();
    const modelSelect = document.getElementById("model-select");
    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();
    const providerConfigs = config.providerConfigs || {};
    const enabledProviders = Object.keys(providerConfigs).filter(
      (provider) => providerConfigs[provider].enabled
    );

    // Clear existing options
    modelSelect.innerHTML = "";

    // Filter models based on enabled providers
    const filteredModels = Object.entries(models).filter(([_, model]) =>
      enabledProviders.includes(model.provider)
    );

    // Check if there are models available
    if (filteredModels.length === 0) {
      console.warn(`No models available for enabled providers.`);
      return;
    }

    // Populate the model selector with filtered models
    for (const [key, model] of filteredModels) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = model.label;
      modelSelect.appendChild(option);
    }

    // Set the selected model
    const savedModelKey =
      currentChat?.selectedModelKey || config.selectedModelKey;

    if (savedModelKey && models[savedModelKey]) {
      modelSelect.value = savedModelKey;
    } else {
      // Default to the first model
      modelSelect.value = filteredModels[0][0];
      ConfigModule.updateConfig({ selectedModelKey: filteredModels[0][0] });
      if (currentChat) {
        currentChat.selectedModelKey = filteredModels[0][0];
        ChatModule.saveChats();
      }
    }
  }

  return {
    populateModelSelector,
    updateModelAndInstructionSelectors,
    updateInstructionsVisibility,
    setupEventListeners,
  };
})();
