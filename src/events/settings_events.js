/**
 * Settings Events Module
 * Handles events related to settings management.
 */
const SettingsEventsModule = (function () {
  function setupEventListeners() {
    const settingsBtn = document.getElementById("settings-btn");
    settingsBtn.addEventListener("click", openSettingsModal);
  }

  function openSettingsModal() {
    const modalContent = `
      <div class="columns">
        <div class="column is-one-quarter">
          <aside class="menu">
            <p class="menu-label">${TranslationModule.translate("settings")}</p>
            <ul class="menu-list">
              <li><a id="settings-tab-providers" class="is-active">${TranslationModule.translate("providers")}</a></li>
              <li><a id="settings-tab-language">${TranslationModule.translate("language")}</a></li>
              <li><a id="settings-tab-data">${TranslationModule.translate("data")}</a></li>
            </ul>
          </aside>
        </div>
        <div class="column">
          <div id="settings-content"></div>
        </div>
      </div>
    `;

    const buttons = [
      { label: TranslationModule.translate("cancel"), value: false },
      { label: TranslationModule.translate("saveChanges"), value: true, class: "is-success" },
    ];

    ModalModule.showCustomModal(
      TranslationModule.translate("settings"),
      modalContent,
      buttons,
      function (result) {
        if (result) {
          saveSettings();
        }

      }
    );

    setTimeout(setupSettingsTabs, 0);
  }

  function setupSettingsTabs() {
    const tabs = {
      providers: document.getElementById("settings-tab-providers"),
      language: document.getElementById("settings-tab-language"),
      data: document.getElementById("settings-tab-data")
    };
    const settingsContent = document.getElementById("settings-content");

    function deactivateAllTabs() {
      Object.values(tabs).forEach(tab => tab.classList.remove("is-active"));
    }

    Object.entries(tabs).forEach(([key, tab]) => {
      tab.addEventListener("click", () => {
        deactivateAllTabs();
        tab.classList.add("is-active");
        settingsContent.innerHTML = getTabContent(key);
        setupTabEventListeners(key);
      });
    });

    // Initially display Providers content
    settingsContent.innerHTML = getTabContent("providers");
    setupTabEventListeners("providers");
  }

  function getTabContent(tab) {
    switch (tab) {
      case "providers": return getProvidersContent();
      case "language": return getLanguageContent();
      case "data": return getDataContent();
      default: return "";
    }
  }

  function setupTabEventListeners(tab) {
    switch (tab) {
      case "providers": setupProvidersTabEventListeners(); break;
      case "language": setupLanguageTabEventListeners(); break;
      case "data": setupDataTabEventListeners(); break;
    }
  }

  function getProvidersContent() {
    const config = ConfigModule.getConfig();
    const providerConfigs = config.providerConfigs || {};
    const enabledProviders = Object.keys(providerConfigs).filter(
      (provider) => providerConfigs[provider].enabled
    );
    let content = '<div style="max-height: 400px; overflow-y: auto;">';

    enabledProviders.forEach((provider) => {
      const providerConfig = providerConfigs[provider] || {};

      // Determine if fields should be disabled based on per-property flags
      const apiKeyDisabled = providerConfig.apiKeyFromProvidersJs ? "disabled" : "";
      const endpointDisabled = providerConfig.endpointFromProvidersJs ? "disabled" : "";

      content += `
        <h2 class="title is-4">${provider}</h2>
        <div class="field">
          <label class="label">${TranslationModule.translate("apiKey")}</label>
          <div class="control">
            <input
              class="input"
              type="password"
              id="api-key-${provider}"
              placeholder="${TranslationModule.translate("enterApiKey")}"
              value="${providerConfig.apiKey || ""}"
              ${apiKeyDisabled}
            />
          </div>
          ${
            providerConfig.apiKeyFromProvidersJs
              ? `<p style="color: gray; font-size: 0.9em;">${TranslationModule.translate("apiKeyPreConfigured")}</p>`
              : ""
          }
        </div>
      `;

      // Include Endpoint field if the provider requires it
      if (provider === "azure" || provider === "ollama") {
        content += `
          <div class="field">
            <label class="label">${TranslationModule.translate("endpointURL")}</label>
            <div class="control">
              <input
                class="input"
                type="text"
                id="endpoint-${provider}"
                placeholder="${TranslationModule.translate("enterEndpointURL")}"
                value="${providerConfig.endpoint || ""}"
                ${endpointDisabled}
              />
            </div>
            ${
              providerConfig.endpointFromProvidersJs
                ? `<p style="color: gray; font-size: 0.9em;">${TranslationModule.translate("endpointPreConfigured")}</p>`
                : ""
            }
          </div>
        `;
      }

      content += "<hr />";
    });

    content += "</div>";
    return content;
  }

  function getLanguageContent() {
    const config = ConfigModule.getConfig();

    return `
      <div class="field">
        <label class="label">${TranslationModule.translate("language")}</label>
        <div class="control">
          <div class="select">
            <select id="language-select">
              <option value="en"${config.language === "en" ? " selected" : ""}>${TranslationModule.translate("english")}</option>
              <option value="sv"${config.language === "sv" ? " selected" : ""}>${TranslationModule.translate("swedish")}</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  function getDataContent() {
    return `
      <div class="field">
        <label class="label">${TranslationModule.translate("clearData")}</label>
        <div class="control">
          <button id="clear-data-button" class="button is-danger">
            ${TranslationModule.translate("clearAllData")}
          </button>
        </div>
        <p class="help">${TranslationModule.translate("clearDataWarning")}</p>
      </div>

      <hr />

      <div class="field">
        <label class="label">${TranslationModule.translate("exportChat")}</label>
        <div class="control">
          <button id="export-chat-button" class="button is-primary">
            ${TranslationModule.translate("exportChat")}
          </button>
        </div>
      </div>

      <div class="field">
        <label class="label">${TranslationModule.translate("importChat")}</label>
        <div class="control">
          <button id="import-chat-button" class="button is-primary">
            ${TranslationModule.translate("importChat")}
          </button>
          <input type="file" id="import-chat-file" style="display: none;" accept=".json" />
        </div>
      </div>

     <hr />

     <div class="field">
       <label class="label">${TranslationModule.translate("exportAllChats")}</label>
       <div class="control">
         <button id="export-all-chats-button" class="button is-primary">
           ${TranslationModule.translate("exportAllChats")}
         </button>
       </div>
     </div>

     <div class="field">
       <label class="label">${TranslationModule.translate("importAllChats")}</label>
       <div class="control">
         <button id="import-all-chats-button" class="button is-primary">
           ${TranslationModule.translate("importAllChats")}
         </button>
         <input type="file" id="import-all-chats-file" style="display: none;" accept=".json" />
       </div>
     </div>
    `;
  }

  function setupProvidersTabEventListeners() {
    const config = ConfigModule.getConfig();
    const providerConfigs = config.providerConfigs || {};

    Object.keys(providerConfigs).forEach((provider) => {
      const providerConfig = providerConfigs[provider];

      // Only attach event listeners if the fields are editable
      if ("apiKey" in providerConfig && !providerConfig.apiKeyFromProvidersJs) {
        const apiKeyInput = document.getElementById(`api-key-${provider}`);
        if (apiKeyInput) {
          apiKeyInput.addEventListener("input", (event) => {
            providerConfig.apiKey = event.target.value.trim();
          });
        }
      }

      if (
        ("endpoint" in providerConfig) &&
        !providerConfig.endpointFromProvidersJs
      ) {
        const endpointInput = document.getElementById(`endpoint-${provider}`);
        if (endpointInput) {
          endpointInput.addEventListener("input", (event) => {
            providerConfig.endpoint = event.target.value.trim();
          });
        }
      }
    });
  }

  function setupLanguageTabEventListeners() {
    const languageSelect = document.getElementById("language-select");
    if (languageSelect) {
      languageSelect.addEventListener("change", (event) => {
        // Language will be saved when settings are saved
      });
    }
  }

  function setupDataTabEventListeners() {
    const clearDataButton = document.getElementById("clear-data-button");
    if (clearDataButton) {
      clearDataButton.addEventListener("click", () => {
        ModalModule.showCustomConfirm(
          TranslationModule.translate("confirmClearData"),
          function (confirmClear) {
            if (confirmClear) {
              // Clear all data from localStorage
              localStorage.clear();
              // Reload the page to reset the application state
              location.reload();
            }
          }
        );
      });
    }
  
    // Attach Export Chat Button listener
    const exportChatButton = document.getElementById("export-chat-button");
    if (exportChatButton) {
      exportChatButton.addEventListener("click", handleExportChat);
    }
  
    // Attach Import Chat Button listener (to trigger the hidden file input)
    const importChatButton = document.getElementById("import-chat-button");
    if (importChatButton) {
      importChatButton.addEventListener("click", () => {
        const fileInput = document.getElementById("import-chat-file");
        if (fileInput) fileInput.click();
      });
    }
  
    // Attach listener for file input change (for importing JSON)
    const importChatFileInput = document.getElementById("import-chat-file");
    if (importChatFileInput) {
      importChatFileInput.addEventListener("change", handleImportChatFileSelected);
    }

 // New: Export All Chats button listener
 const exportAllChatsButton = document.getElementById("export-all-chats-button");
 if (exportAllChatsButton) {
   exportAllChatsButton.addEventListener("click", handleExportAllChats);
 }

 // New: Import All Chats button listener (triggering hidden file input)
 const importAllChatsButton = document.getElementById("import-all-chats-button");
 if (importAllChatsButton) {
   importAllChatsButton.addEventListener("click", () => {
     const fileInput = document.getElementById("import-all-chats-file");
     if (fileInput) fileInput.click();
   });
 }

 // New: Listener for the file input change event (all chats)
 const importAllChatsFileInput = document.getElementById("import-all-chats-file");
 if (importAllChatsFileInput) {
   importAllChatsFileInput.addEventListener("change", handleImportAllChatsFileSelected);
 }
  }

  function collectProviderConfigs() {
    const config = ConfigModule.getConfig();
    const providerConfigs = config.providerConfigs || {};
    const updatedProviderConfigs = {};

    Object.keys(providerConfigs).forEach((provider) => {
      const providerConfig = providerConfigs[provider];
      if (providerConfig.enabled) {
        const apiKeyInput = document.getElementById(`api-key-${provider}`);
        const apiKey = apiKeyInput
          ? apiKeyInput.value.trim()
          : providerConfig.apiKey || "";

        let endpoint = providerConfig.endpoint || "";
        if (provider === "azure" || provider === "ollama") {
          const endpointInput = document.getElementById(`endpoint-${provider}`);
          endpoint = endpointInput ? endpointInput.value.trim() : endpoint;
        }

        const updatedProviderConfig = {
          ...providerConfig, // Preserve existing properties like 'enabled'
        };

        // Only update apiKey if it was not provided via providers.js
        if (!providerConfig.apiKeyFromProvidersJs) {
          updatedProviderConfig.apiKey = apiKey;
        }

        // Only update endpoint if it was not provided via providers.js
        if (
          (provider === "azure" || provider === "ollama") &&
          !providerConfig.endpointFromProvidersJs
        ) {
          updatedProviderConfig.endpoint = endpoint;
        }

        updatedProviderConfigs[provider] = updatedProviderConfig;
      }
    });

    return updatedProviderConfigs;
  }

  function saveSettings() {
    const config = ConfigModule.getConfig();
    const updatedConfig = {
      providerConfigs: collectProviderConfigs(),
      language: document.getElementById("language-select")?.value || config.language,
      theme: document.body.classList.contains("light-mode") ? "light-mode" : "dark-mode"
    };

    ConfigModule.updateConfig(updatedConfig);
    TranslationModule.setLanguage(updatedConfig.language);
    TranslationModule.applyTranslations();

    ModalModule.showCustomAlert(TranslationModule.translate("settingsSaved"));
  }

  function handleExportChat() {
    const currentChat = ChatModule.getCurrentChat();
    if (!currentChat) {
      ModalModule.showCustomAlert(TranslationModule.translate("noChatSelectedToExport"));
      return;
    }

    // Compute the unique assistants used in this chat (from messages with role "assistant")
    let assistantsUsed = [];
    if (Array.isArray(currentChat.conversation)) {
      const assistSet = new Set();
      currentChat.conversation.forEach(msg => {
        if (msg.role === "assistant") {
          // If the message holds an "assistant" property, use it; otherwise fallback to the chat's selectedModelKey
          if (msg.assistant) {
            assistSet.add(msg.assistant);
          } else if (currentChat.selectedModelKey) {
            assistSet.add(currentChat.selectedModelKey);
          }
        }
      });
      assistantsUsed = Array.from(assistSet);
    }
  
    // Compute the instructions used in this chat.
    let instructionsUsed = [];
    if (currentChat.selectedInstructionId) {
      // Use the global instructions array if available, otherwise fall back to default instructions.
      const instructionsLookup = window.instructions || window.defaultInstructions;
      const matchingInstr = instructionsLookup.find(instr => instr.id === currentChat.selectedInstructionId);
      if (matchingInstr) {
        instructionsUsed.push(matchingInstr);
      }
    }
    // Create an export object that includes assistants and instructions.
    const exportedChat = {
      ...currentChat,
      assistants: assistantsUsed,
      instructions: instructionsUsed
    };
  
    const jsonStr = JSON.stringify(exportedChat, null, 2);
    // Create a safe filename from the chat name.
    const safeName = currentChat.name
      ? currentChat.name.replace(/[^\w\d_\-]/g, "_")
      : "chat";
    const filename = `${safeName}.json`;

    // Create a temporary download link.
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImportChatFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        // Parse the imported JSON.
        const importedChat = JSON.parse(e.target.result);
        
        // If the chat export contains assistants, update the global assistant list.
        if (importedChat.assistants && Array.isArray(importedChat.assistants)) {
          importedChat.assistants.forEach(assistId => {
            if (!window.models[assistId]) {
              // Add the new assistant with a basic structure; adjust as needed.
              window.models[assistId] = { id: assistId, name: assistId, provider: "custom" };
            }
          });
          // Refresh the assistant/model selection UI immediately.
          if (typeof ModelSelectionEventsModule.populateModelSelector === "function") {
            ModelSelectionEventsModule.populateModelSelector();
          }
        }
      
        // If the imported chat contains instructions, merge them into custom instructions.
        if (importedChat.instructions && Array.isArray(importedChat.instructions)) {
          const existingCustomInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
          importedChat.instructions.forEach(instr => {
            if (!existingCustomInstructions.find(ci => ci.id === instr.id)) {
              existingCustomInstructions.push(instr);
            }
          });
          localStorage.setItem("customInstructions", JSON.stringify(existingCustomInstructions));
        }
      
        // Create a new chat object (assigning a new ID and timestamp).
        const newChat = {
          ...importedChat,
          id: Date.now().toString(),
          lastUpdated: Date.now(),
        };

        // Insert the new chat at the beginning of the chat list.
        const state = ChatModule.getCurrentState();
        state.chats.unshift(newChat);

        // Save the updated chats and load the new chat.
        ChatModule.saveChats();
        ChatModule.loadChat(newChat.id);

        const newState = ChatModule.getCurrentState();
        RenderingModule.renderChatList(newState.chats, newState.currentChatId);
        RenderingModule.renderConversation(newState.conversation);

        ModalModule.showCustomAlert(TranslationModule.translate("chatImportedSuccessfully"));
      } catch (error) {
        console.error("Error importing chat:", error);
        ModalModule.showCustomAlert(TranslationModule.translate("errorImportingChatCheckFileFormat"));
      }
    };
    reader.readAsText(file);
  }

  function handleExportAllChats() {
    const state = ChatModule.getCurrentState();
    // For each chat, compute its assistants and instructions properties.
    const chatsWithAssistants = state.chats.map(chat => {
      let assistantsUsed = [];
      let instructionsUsed = [];
      if (Array.isArray(chat.conversation)) {
        const assistSet = new Set();
        chat.conversation.forEach(msg => {
          if (msg.role === "assistant") {
            if (msg.assistant) {
              assistSet.add(msg.assistant);
            } else if (chat.selectedModelKey) {
              assistSet.add(chat.selectedModelKey);
            }
          }
        });
        assistantsUsed = Array.from(assistSet);
      }
      // Compute instructions used in this chat using selectedInstructionId.
      if (chat.selectedInstructionId) {
        const instructionsLookup = window.instructions || window.defaultInstructions;
        const matchingInstr = instructionsLookup.find(instr => instr.id === chat.selectedInstructionId);
        if (matchingInstr) {
          instructionsUsed.push(matchingInstr);
        }
      }
      return { ...chat, assistants: assistantsUsed, instructions: instructionsUsed };
    });
  
    // Compute the global union of assistants across all chats.
    const globalAssistantsSet = new Set();
    chatsWithAssistants.forEach(chat => {
      if (Array.isArray(chat.assistants))
        chat.assistants.forEach(a => globalAssistantsSet.add(a));
    });
    const globalAssistants = Array.from(globalAssistantsSet);
      
    // Compute the global union of instructions across all chats.
    const globalInstructionsSet = new Set();
    chatsWithAssistants.forEach(chat => {
      if (Array.isArray(chat.instructions))
        chat.instructions.forEach(instr => globalInstructionsSet.add(instr.id));
    });
    const globalInstructions = [];
    const instructionsLookup = window.instructions || window.defaultInstructions;
    globalInstructionsSet.forEach(id => {
      const instrDef = instructionsLookup.find(instr => instr.id === id);
      if (instrDef) globalInstructions.push(instrDef);
    });
      
    // Export an object that contains chats, global assistants, and global instructions.
    const exportObj = {
      chats: chatsWithAssistants,
      assistants: globalAssistants,
      instructions: globalInstructions
    };
  
    const jsonStr = JSON.stringify(exportObj, null, 2);
    const filename = "all-chats.json";

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImportAllChatsFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        let chatsToImport;
        if (Array.isArray(importedData)) {
          // Old format: an array of chats
          chatsToImport = importedData;
        } else if (importedData.chats && Array.isArray(importedData.chats)) {
          // New format: object with "chats" and possibly "assistants" and "instructions"
          chatsToImport = importedData.chats;
          // If the exported data contains assistants, update the global assistant list.
          if (importedData.assistants && Array.isArray(importedData.assistants)) {
            importedData.assistants.forEach(assistId => {
              if (!window.models[assistId]) {
                window.models[assistId] = { id: assistId, name: assistId, provider: "custom" };
              }
            });
            if (typeof ModelSelectionEventsModule.populateModelSelector === "function") {
              ModelSelectionEventsModule.populateModelSelector();
            }
          }
          // If instructions exist in the exported file, merge them into custom instructions.
          if (importedData.instructions && Array.isArray(importedData.instructions)) {
            const existingCustomInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
            importedData.instructions.forEach(instr => {
              if (!existingCustomInstructions.find(ci => ci.id === instr.id)) {
                existingCustomInstructions.push(instr);
              }
            });
            localStorage.setItem("customInstructions", JSON.stringify(existingCustomInstructions));
          }
          // (Optional: Process importedData.assistants if needed)
        } else {
          throw new Error("Imported data is not in a recognized format");
        }
        
        ChatModule.importChats(chatsToImport);

        const state = ChatModule.getCurrentState();
        RenderingModule.renderChatList(state.chats, state.currentChatId);
        RenderingModule.renderConversation(state.conversation);

        ModalModule.showCustomAlert(TranslationModule.translate("chatImportedSuccessfully"));
      } catch (error) {
        console.error("Error importing all chats:", error);
        ModalModule.showCustomAlert(TranslationModule.translate("errorImportingChatCheckFileFormat"));
      }
    };
    reader.readAsText(file);
  }

  return {
    setupEventListeners
  };
})();
