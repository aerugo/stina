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
              <li><a id="settings-tab-providers" class="is-active">${TranslationModule.translate(
                "providers"
              )}</a></li>
              <li><a id="settings-tab-language">${TranslationModule.translate(
                "language"
              )}</a></li>
              <li><a id="settings-tab-data">${TranslationModule.translate(
                "data"
              )}</a></li>
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
      {
        label: TranslationModule.translate("saveChanges"),
        value: true,
        class: "is-success",
      },
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
      data: document.getElementById("settings-tab-data"),
    };
    const settingsContent = document.getElementById("settings-content");

    function deactivateAllTabs() {
      Object.values(tabs).forEach((tab) => tab.classList.remove("is-active"));
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
      case "providers":
        return getProvidersContent();
      case "language":
        return getLanguageContent();
      case "data":
        return getDataContent();
      default:
        return "";
    }
  }

  function setupTabEventListeners(tab) {
    switch (tab) {
      case "providers":
        setupProvidersTabEventListeners();
        break;
      case "language":
        setupLanguageTabEventListeners();
        break;
      case "data":
        setupDataTabEventListeners();
        break;
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
      const apiKeyDisabled = providerConfig.apiKeyFromProvidersJs
        ? "disabled"
        : "";
      const endpointDisabled = providerConfig.endpointFromProvidersJs
        ? "disabled"
        : "";

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
              ? `<p style="color: gray; font-size: 0.9em;">${TranslationModule.translate(
                  "apiKeyPreConfigured"
                )}</p>`
              : ""
          }
        </div>
      `;

      // Include Endpoint field if the provider requires it
      if (provider === "azure" || provider === "ollama") {
        content += `
          <div class="field">
            <label class="label">${TranslationModule.translate(
              "endpointURL"
            )}</label>
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
                ? `<p style="color: gray; font-size: 0.9em;">${TranslationModule.translate(
                    "endpointPreConfigured"
                  )}</p>`
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
              <option value="en"${
                config.language === "en" ? " selected" : ""
              }>${TranslationModule.translate("english")}</option>
              <option value="sv"${
                config.language === "sv" ? " selected" : ""
              }>${TranslationModule.translate("swedish")}</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  function getDataContent() {
    // Get current state to identify the chats
    const state = ChatModule.getCurrentState();
    const currentChat = ChatModule.getCurrentChat();

    // Build a list of <option>s for the chat selector (escape the name as needed)
    let chatOptionsHtml = "";
    state.chats.forEach((chat) => {
      const isSelected = chat.id === currentChat.id ? "selected" : "";
      // Here, use your sanitization method; in this example we use DOMPurify:
      const escapedChatName = DOMPurify.sanitize(chat.name);
      chatOptionsHtml += `<option value="${chat.id}" ${isSelected}>${escapedChatName}</option>`;
    });

    // Return a structured layout with three sections: Export, Import, Reset.
    return `
  <div class="data-tab-container" style="max-height: 480px; overflow-y: auto;">

    <!-- EXPORT SECTION -->
    <section class="data-section">
      <h2 class="title is-5">${TranslationModule.translate("exportChat")}</h2>
      <div class="field is-grouped" style="flex-wrap: wrap;">
        <!-- Chat Selector: user chooses the chat to export -->
        <div class="control">
          <div class="select">
            <select id="export-chat-selector">
              ${chatOptionsHtml}
            </select>
          </div>
        </div>

        <!-- Export Current Chat Button -->
        <div class="control">
          <button id="export-chat-button" class="button is-primary">
            ${TranslationModule.translate("exportChat")}
          </button>
        </div>

        <!-- Export All Chats Button -->
        <div class="control">
          <button id="export-all-chats-button" class="button is-primary">
            ${TranslationModule.translate("exportAllChats")}
          </button>
        </div>
      </div>
    </section>

    <hr />

    <!-- IMPORT SECTION -->
    <section class="data-section">
      <h2 class="title is-5">${TranslationModule.translate("importChat")}</h2>
      <div 
        id="import-drop-area" 
        class="import-drop-area" 
        style="border: 2px dashed #ccc; padding: 2rem; text-align: center; cursor: pointer;"
      >
        <p style="margin-bottom: 1rem;">
          ${TranslationModule.translate("dragDropOrClickToImport")}
        </p>
        <p class="help" style="margin-bottom: 0.5rem;">
          ${TranslationModule.translate("importChatHelpText")}
        </p>
        <!-- Hidden file input for selecting a file -->
        <input 
          type="file" 
          id="import-chat-file" 
          style="display: none;" 
          accept=".json" 
        />
      </div>
    </section>

    <hr />

    <!-- RESET SECTION -->
    <section class="data-section">
      <h2 class="title is-5">${TranslationModule.translate("clearData")}</h2>
      <div class="field">
        <p class="help">
          ${TranslationModule.translate("clearDataWarning")}
        </p>
        <button id="clear-data-button" class="button is-danger">
          ${TranslationModule.translate("clearAllData")}
        </button>
      </div>
    </section>

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
        "endpoint" in providerConfig &&
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
    // --- RESET SECTION ---
    const clearDataButton = document.getElementById("clear-data-button");
    if (clearDataButton) {
      clearDataButton.addEventListener("click", () => {
        ModalModule.showCustomConfirm(
          TranslationModule.translate("confirmClearData"),
          function (confirmClear) {
            if (confirmClear) {
              localStorage.clear();
              location.reload();
            }
          }
        );
      });
    }

    // --- EXPORT SECTION ---
    const exportChatSelector = document.getElementById("export-chat-selector");
    const exportChatButton = document.getElementById("export-chat-button");
    if (exportChatButton && exportChatSelector) {
      exportChatButton.addEventListener("click", () => {
        const chatId = exportChatSelector.value;
        if (!chatId) {
          ModalModule.showCustomAlert(
            TranslationModule.translate("noChatSelectedToExport")
          );
          return;
        }
        handleExportChatById(chatId);
      });
    }
    const exportAllChatsButton = document.getElementById(
      "export-all-chats-button"
    );
    if (exportAllChatsButton) {
      exportAllChatsButton.addEventListener("click", handleExportAllChats);
    }

    // --- IMPORT SECTION ---
    const dropArea = document.getElementById("import-drop-area");
    const fileInput = document.getElementById("import-chat-file");

    if (dropArea && fileInput) {
      // When the drop area is clicked, trigger the hidden file input.
      dropArea.addEventListener("click", () => fileInput.click());

      // When a file is selected via the file input.
      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length) {
          handleFileImport(e.target.files[0]);
          e.target.value = "";
        }
      });

      // Drag events to style the drop area.
      dropArea.addEventListener("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.backgroundColor = "#f0f0f0";
      });
      dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.backgroundColor = "#f0f0f0";
      });
      dropArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.backgroundColor = "";
      });
      dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.style.backgroundColor = "";
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
          handleFileImport(e.dataTransfer.files[0]);
        }
      });
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
      language:
        document.getElementById("language-select")?.value || config.language,
      theme: document.body.classList.contains("light-mode")
        ? "light-mode"
        : "dark-mode",
    };

    ConfigModule.updateConfig(updatedConfig);
    TranslationModule.setLanguage(updatedConfig.language);
    TranslationModule.applyTranslations();

    ModalModule.showCustomAlert(TranslationModule.translate("settingsSaved"));
  }

  function handleExportChatById(chatId) {
    const state = ChatModule.getCurrentState();
    const chatToExport = state.chats.find((c) => c.id === chatId);
    if (!chatToExport) {
      ModalModule.showCustomAlert(TranslationModule.translate("chatNotFound"));
      return;
    }

    let assistantsUsed = [];
    if (Array.isArray(chatToExport.conversation)) {
      const assistSet = new Set();
      chatToExport.conversation.forEach((msg) => {
        if (msg.role === "assistant") {
          if (msg.assistant) assistSet.add(msg.assistant);
          else if (chatToExport.selectedModelKey)
            assistSet.add(chatToExport.selectedModelKey);
        }
      });
      assistantsUsed = Array.from(assistSet);
    }

    let instructionsUsed = [];
    if (chatToExport.selectedInstructionId) {
      const instructionsLookup =
        window.instructions || window.defaultInstructions;
      const matchingInstr = instructionsLookup.find(
        (instr) => instr.id === chatToExport.selectedInstructionId
      );
      if (matchingInstr) instructionsUsed.push(matchingInstr);
    }

    const exportedChat = {
      ...chatToExport,
      assistants: assistantsUsed,
      instructions: instructionsUsed,
    };

    const jsonStr = JSON.stringify(exportedChat, null, 2);
    const safeName = chatToExport.name
      ? chatToExport.name.replace(/[^\w\d_\-]/g, "_")
      : "chat";
    const filename = `${safeName}.json`;

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleExportAllChats() {
    const state = ChatModule.getCurrentState();
    const chatsWithAssistants = state.chats.map((chat) => {
      const assistSet = new Set();
      if (Array.isArray(chat.conversation)) {
        chat.conversation.forEach((msg) => {
          if (msg.role === "assistant") {
            if (msg.assistant) assistSet.add(msg.assistant);
            else if (chat.selectedModelKey)
              assistSet.add(chat.selectedModelKey);
          }
        });
      }
      const assistantsUsed = Array.from(assistSet);
      let instructionsUsed = [];
      if (chat.selectedInstructionId) {
        const instructionsLookup =
          window.instructions || window.defaultInstructions;
        const matchingInstr = instructionsLookup.find(
          (instr) => instr.id === chat.selectedInstructionId
        );
        if (matchingInstr) instructionsUsed.push(matchingInstr);
      }
      return {
        ...chat,
        assistants: assistantsUsed,
        instructions: instructionsUsed,
      };
    });

    const globalAssistants = Array.from(
      new Set(chatsWithAssistants.flatMap((c) => c.assistants))
    );
    const globalInstructionsMap = new Map();
    chatsWithAssistants.forEach((chat) => {
      if (Array.isArray(chat.instructions)) {
        chat.instructions.forEach((instr) => {
          if (!globalInstructionsMap.has(instr.id)) {
            const fullDef =
              (window.instructions || window.defaultInstructions).find(
                (i) => i.id === instr.id
              ) || instr;
            globalInstructionsMap.set(instr.id, fullDef);
          }
        });
      }
    });
    const globalInstructions = Array.from(globalInstructionsMap.values());

    const exportObj = {
      chats: chatsWithAssistants,
      assistants: globalAssistants,
      instructions: globalInstructions,
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

  function handleFileImport(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);
        // If there's a 'chats' array, assume multi-chat format.
        if (importedData.chats && Array.isArray(importedData.chats)) {
          importAllChatsData(importedData);
        } else {
          importSingleChatData(importedData);
        }
        ModalModule.showCustomAlert(
          TranslationModule.translate("chatImportedSuccessfully")
        );
      } catch (error) {
        console.error("Error importing chat:", error);
        ModalModule.showCustomAlert(
          TranslationModule.translate("errorImportingChatCheckFileFormat")
        );
      }
    };
    reader.readAsText(file);
  }

  /**
   * Import multiple chats from the imported data.
   * This function processes exported data containing a "chats" array
   * (and optionally "assistants" and "instructions") and then updates the
   * application state accordingly.
   */
  function importAllChatsData(importedData) {
    let chatsToImport;
    if (Array.isArray(importedData)) {
      // Old format: exported data is directly an array of chats.
      chatsToImport = importedData;
    } else if (importedData.chats && Array.isArray(importedData.chats)) {
      // New format: the exported object has a 'chats' property.
      chatsToImport = importedData.chats;

      // Process assistants: add any missing assistant to global models.
      if (importedData.assistants && Array.isArray(importedData.assistants)) {
        importedData.assistants.forEach((assistId) => {
          if (!window.models[assistId]) {
            window.models[assistId] = {
              id: assistId,
              name: assistId,
              provider: "custom",
            };
          }
        });
        if (
          typeof ModelSelectionEventsModule.populateModelSelector === "function"
        ) {
          ModelSelectionEventsModule.populateModelSelector();
        }
      }

      // Process instructions: merge imported instructions into custom instructions.
      if (
        importedData.instructions &&
        Array.isArray(importedData.instructions)
      ) {
        const existingCustomInstructions =
          JSON.parse(localStorage.getItem("customInstructions")) || [];
        importedData.instructions.forEach((instr) => {
          if (!existingCustomInstructions.find((ci) => ci.id === instr.id)) {
            existingCustomInstructions.push(instr);
          }
        });
        localStorage.setItem(
          "customInstructions",
          JSON.stringify(existingCustomInstructions)
        );
        if (
          typeof InstructionEventsModule.populateInstructions === "function"
        ) {
          InstructionEventsModule.populateInstructions();
        }
      }
    } else {
      throw new Error("Imported data is not in a recognized format");
    }

    // Merge imported chats with the existing ones.
    ChatModule.importChats(chatsToImport);

    // Refresh the UI with the new chat list.
    const state = ChatModule.getCurrentState();
    RenderingModule.renderChatList(state.chats, state.currentChatId);
    RenderingModule.renderConversation(state.conversation);

    ModalModule.showCustomAlert(
      TranslationModule.translate("chatImportedSuccessfully")
    );
  }

  /**
   * (Optional) Import a single chat from the imported data.
   * This function is similar to handleImportChatFileSelected, but can be called by handleFileImport.
   */
  function importSingleChatData(importedChat) {
    // Process assistants.
    if (importedChat.assistants && Array.isArray(importedChat.assistants)) {
      importedChat.assistants.forEach((assistId) => {
        if (!window.models[assistId]) {
          window.models[assistId] = {
            id: assistId,
            name: assistId,
            provider: "custom",
          };
        }
      });
      if (
        typeof ModelSelectionEventsModule.populateModelSelector === "function"
      ) {
        ModelSelectionEventsModule.populateModelSelector();
      }
    }

    // Process instructions.
    if (importedChat.instructions && Array.isArray(importedChat.instructions)) {
      const existingCustomInstructions =
        JSON.parse(localStorage.getItem("customInstructions")) || [];
      importedChat.instructions.forEach((instr) => {
        if (!existingCustomInstructions.find((ci) => ci.id === instr.id)) {
          existingCustomInstructions.push(instr);
        }
      });
      localStorage.setItem(
        "customInstructions",
        JSON.stringify(existingCustomInstructions)
      );
      if (typeof InstructionEventsModule.populateInstructions === "function") {
        InstructionEventsModule.populateInstructions();
      }
    }

    // Create new chat object with a new ID.
    const newChat = {
      ...importedChat,
      id: Date.now().toString(),
      lastUpdated: Date.now(),
    };

    // Prepend the new chat to the chat list.
    const state = ChatModule.getCurrentState();
    state.chats.unshift(newChat);
    ChatModule.saveChats();
    ChatModule.loadChat(newChat.id);
    const newState = ChatModule.getCurrentState();
    RenderingModule.renderChatList(newState.chats, newState.currentChatId);
    RenderingModule.renderConversation(newState.conversation);
  }

  return {
    setupEventListeners,
  };
})();
