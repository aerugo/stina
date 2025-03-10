/**
 * Model Selection Events Module
 * Handles events related to model selection and updates.
 */
const ModelSelectionEventsModule = (function () {
  let clearanceNoticeDismissed = false;
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
  
    // Update model dropdown to reflect document classification requirements
    populateModelDropdown();
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
      const selectedModel = ModelsModule.getModel(newModelKey);
      if (selectedModel && selectedModel.classification_clearance === 1) {
        clearanceNoticeDismissed = false;
      }
      const currentChat = ChatModule.getCurrentChat();
      if (currentChat) {
        currentChat.selectedModelKey = newModelKey;
        ChatModule.saveChats();
      }
      // Update instruction visibility and open information notice
      setTimeout(() => {
        updateInstructionsVisibility();
        updateModelClearanceNotice();
        console.log("Model changed to:", newModelKey, "- Updated instruction visibility and clearance notice");
      }, 0);
    });
  }

  function populateModelSelector() {
    // This function is now just a wrapper for populateModelDropdown
    // to maintain backward compatibility
    populateModelDropdown();
  }

  function populateModelDropdown() {
    const models = ModelsModule.getModels();
    const modelSelect = document.getElementById("model-select");
    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();
    const providerConfigs = config.providerConfigs || {};
    const enabledProviders = Object.keys(providerConfigs).filter(
      (provider) => providerConfigs[provider].enabled
    );

    // Compute the maximum required clearance from all attached files in the chat.
    let maxRequiredClearance = 1;
    if (currentChat && currentChat.conversation) {
      currentChat.conversation.forEach(msg => {
        if (msg.attachedFiles && Array.isArray(msg.attachedFiles)) {
          msg.attachedFiles.forEach(file => {
            if (!file.ignored) { // Only consider non-ignored files
              const fileLevel = file.classificationLevel || 1;
              if (fileLevel > maxRequiredClearance) {
                maxRequiredClearance = fileLevel;
              }
            }
          });
        }
      });
    }

    // Clear existing options
    modelSelect.innerHTML = "";

    // Filter models based on enabled providers
    const filteredModels = Object.entries(models).filter(([_, model]) =>
      enabledProviders.includes(model.provider)
    );

    // Check if there are models available
    if (filteredModels.length === 0) {
      console.warn(`No models available for enabled providers.`);
      modelSelect.innerHTML = `<option disabled>${TranslationModule.translate("noAvailableModels")}</option>`;
      return;
    }

    // Track if we have any models with sufficient clearance
    let hasAvailableModel = false;

    // Populate the model selector with filtered models
    for (const [key, model] of filteredModels) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = model.label;
    
      // Check if model has sufficient clearance
      const modelClearance = model.classification_clearance || 1;
      if (modelClearance < maxRequiredClearance) {
        option.disabled = true;
        option.textContent += ` (${TranslationModule.translate("insufficientClearance") || "insufficient clearance"})`;
      } else {
        hasAvailableModel = true;
      }
    
      modelSelect.appendChild(option);
    }

    // If no model meets clearance, show a fallback option, disable the send button, and show warning
    if (!hasAvailableModel && maxRequiredClearance > 1) {
      modelSelect.innerHTML = `<option disabled>${TranslationModule.translate("noAvailableModels")}</option>`;
      const sendBtn = document.getElementById("send-btn");
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.classList.add("is-disabled");
      }
      
      // Show classification warning message
      const warningEl = document.getElementById("classification-warning");
      if (warningEl) {
        warningEl.style.display = "block";
        warningEl.textContent = `${TranslationModule.translate("insufficientModelClearance")} ${TranslationModule.translate("insufficientForDocuments")} (${TranslationModule.translate("required")}: ${maxRequiredClearance}). ${TranslationModule.translate("pleaseSelectHigherClearanceModel")}`;
      }
      
      return;
    } else {
      // Hide warning if models are available
      const warningEl = document.getElementById("classification-warning");
      if (warningEl) {
        warningEl.style.display = "none";
      }
    }

    // Set the selected model
    const savedModelKey = currentChat?.selectedModelKey || config.selectedModelKey;

    if (savedModelKey && models[savedModelKey]) {
      modelSelect.value = savedModelKey;
    
      // If the currently selected model doesn't have sufficient clearance,
      // try to select the first available model with sufficient clearance
      if (models[savedModelKey].classification_clearance < maxRequiredClearance) {
        for (const [key, model] of filteredModels) {
          if (model.classification_clearance >= maxRequiredClearance) {
            modelSelect.value = key;
            if (currentChat) {
              currentChat.selectedModelKey = key;
              ChatModule.saveChats();
            }
            ConfigModule.updateConfig({ selectedModelKey: key });
            break;
          }
        }
      }
    } else {
      // Default to the first model with sufficient clearance
      let defaultModel = filteredModels[0][0];
      for (const [key, model] of filteredModels) {
        if (model.classification_clearance >= maxRequiredClearance) {
          defaultModel = key;
          break;
        }
      }
    
      modelSelect.value = defaultModel;
      ConfigModule.updateConfig({ selectedModelKey: defaultModel });
      if (currentChat) {
        currentChat.selectedModelKey = defaultModel;
        ChatModule.saveChats();
      }
    }
  
    // Update the send button state
    const sendBtn = document.getElementById("send-btn");
    if (sendBtn) {
      const selectedModelKey = modelSelect.value;
      const selectedModel = models[selectedModelKey];
      if (selectedModel && selectedModel.classification_clearance < maxRequiredClearance) {
        sendBtn.disabled = true;
        sendBtn.classList.add("is-disabled");
        
        // Show classification warning message for the selected model
        const warningEl = document.getElementById("classification-warning");
        if (warningEl) {
          warningEl.style.display = "block";
          warningEl.textContent = `${TranslationModule.translate("insufficientModelClearance")} (${selectedModel.classification_clearance}) ${TranslationModule.translate("insufficientForDocuments")} (${TranslationModule.translate("required")}: ${maxRequiredClearance}). ${TranslationModule.translate("pleaseSelectHigherClearanceModel")}`;
        }
      } else {
        sendBtn.disabled = false;
        sendBtn.classList.remove("is-disabled");
        
        // Hide warning if selected model has sufficient clearance
        const warningEl = document.getElementById("classification-warning");
        if (warningEl) {
          warningEl.style.display = "none";
        }
      }
    
      // Update the open information notice
      updateModelClearanceNotice();
    }
  }

  function updateModelClearanceNotice() {
    const modelSelect = document.getElementById("model-select");
    const noticeEl = document.getElementById("model-clearance-notice");
    if (modelSelect && noticeEl) {
      const selectedModelKey = modelSelect.value;
      const selectedModel = ModelsModule.getModel(selectedModelKey);
      const clearance = (selectedModel && selectedModel.classification_clearance) || 1;
      if (clearance === 1 && !clearanceNoticeDismissed) {
        noticeEl.innerHTML = `<span>${TranslationModule.translate("openInformationModelNotice")}</span> <button id="dismiss-clearance-notice" style="background: none; border: none; font-size: 1rem; cursor: pointer;">✕</button>`;
        noticeEl.style.display = "block";
        const dismissBtn = noticeEl.querySelector("#dismiss-clearance-notice");
        if (dismissBtn) {
          dismissBtn.addEventListener("click", () => {
            noticeEl.style.display = "none";
            clearanceNoticeDismissed = true;
          });
        }
      } else {
        noticeEl.style.display = "none";
      }
    }
  }

  function resetClearanceNoticeDismissed() {
    clearanceNoticeDismissed = false;
  }

  return {
    populateModelSelector,
    populateModelDropdown,
    updateModelAndInstructionSelectors,
    updateInstructionsVisibility,
    setupEventListeners,
    resetClearanceNoticeDismissed
  };
})();
