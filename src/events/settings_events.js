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

        // Export Chat
        const exportChatButton = document.getElementById("export-chat-button");
        if (exportChatButton) {
          exportChatButton.addEventListener("click", handleExportChat);
        }

        // Import Chat (trigger hidden file input)
        const importChatButton = document.getElementById("import-chat-button");
        if (importChatButton) {
          importChatButton.addEventListener("click", () => {
            const fileInput = document.getElementById("import-chat-file");
            if (fileInput) fileInput.click();
          });
        }

        // Listen for the import file change event
        const importChatFileInput = document.getElementById("import-chat-file");
        if (importChatFileInput) {
          importChatFileInput.addEventListener("change", handleImportChatFileSelected);
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

    // Serialize the chat with pretty-print formatting.
    const jsonStr = JSON.stringify(currentChat, null, 2);
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

  return {
    setupEventListeners
  };
})();
