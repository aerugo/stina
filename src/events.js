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
  }

  return {
    setupEventListeners,
  };
})();
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

  function updateModelAndInstructionSelectors() {
    const models = ModelsModule.getModels();
    const modelSelect = document.getElementById("model-select");
    const instructionsSelect = document.getElementById("instructions-select");

    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();

    if (currentChat) {
      modelSelect.value =
        currentChat.selectedModelKey || config.selectedModelKey || "gpt-4o";
      instructionsSelect.value =
        currentChat.selectedInstructionId ||
        config.selectedInstructionId ||
        instructions[0].id;
    } else {
      modelSelect.value = config.selectedModelKey || "gpt-4o";
      instructionsSelect.value =
        config.selectedInstructionId || instructions[0].id;
    }
    updateInstructionsVisibility();
    updateEditButtonVisibility();
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

    instructionsGroup.style.display = selectedModelParams.system
      ? "flex"
      : "none";
  }

  function updateEditButtonVisibility() {
    const selectedValue = instructionsSelect.value;
    if (selectedValue.startsWith("custom_")) {
      editInstructionBtn.style.display = "inline-block";
    } else {
      editInstructionBtn.style.display = "none";
    }
  }

  function setupEventListeners() {
    const models = ModelsModule.getModels();
    // Add mobile menu toggle
    const navbarBurger = document.querySelector(".navbar-burger");
    navbarBurger.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebarMenu");
      sidebar.classList.toggle("is-active");
    });
    const modelSelect = document.getElementById("model-select");
    instructionsSelect = document.getElementById("instructions-select");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    // Add auto-resize functionality for textarea
    userInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });
    const newChatBtn = document.getElementById("new-chat-btn");
    const settingsBtn = document.getElementById("settings-btn");
    const chatListContainer = document.getElementById("chat-list");
    editInstructionBtn = document.getElementById("edit-instruction-btn");

    // Setup basic event listeners
    newChatBtn.addEventListener("click", function () {
      const state = ChatModule.createNewChat();
      RenderingModule.renderChatList(state.chats, state.currentChatId);
      RenderingModule.renderConversation(state.conversation);
      updateModelAndInstructionSelectors();
    });

    sendBtn.addEventListener("click", handleSendButtonClick);
    userInput.addEventListener("keydown", handleUserInputKeyDown);
    settingsBtn.addEventListener("click", openSettingsModal);
    chatListContainer.addEventListener("click", handleChatListClick);
    window.addEventListener("click", handleWindowClick);

    // Initialize model selector with current provider's models
    const config = ConfigModule.getConfig();
    populateModelSelector(config.provider || "azure");

    // Setup model selection change handler
    modelSelect.addEventListener("change", function () {
      const newModelKey = this.value;
      ConfigModule.updateConfig({ selectedModelKey: newModelKey });
      // Update the current chat's selected model
      const currentChat = ChatModule.getCurrentChat();
      if (currentChat) {
        currentChat.selectedModelKey = newModelKey;
        ChatModule.saveChats();
      }
      updateInstructionsVisibility();
    });

    // Setup instructions handling

    function populateInstructions() {
      instructionsSelect.innerHTML = "";
      const currentChat = ChatModule.getCurrentChat();
      const config = ConfigModule.getConfig();

      // Get custom instructions from localStorage
      const customInstructions =
        JSON.parse(localStorage.getItem("customInstructions")) || [];

      // Combine defaultInstructions and customInstructions
      window.instructions =
        window.defaultInstructions.concat(customInstructions);

      const selectedInstructionId =
        (currentChat && currentChat.selectedInstructionId) ||
        config.selectedInstructionId ||
        window.instructions[0]?.id;

      // Loop through all instructions in window.instructions
      window.instructions.forEach((instruction) => {
        const option = document.createElement("option");
        option.value = instruction.id;
        option.textContent = instruction.label;
        instructionsSelect.appendChild(option);
      });

      // Add option for creating new instruction
      const customOption = document.createElement("option");
      customOption.value = "custom";
      customOption.textContent = TranslationModule.translate(
        "createNewInstruction"
      );
      instructionsSelect.appendChild(customOption);

      instructionsSelect.value = selectedInstructionId;
      updateEditButtonVisibility();
    }

    // Initialize instructions
    populateInstructions();
    updateInstructionsVisibility();
    updateModelAndInstructionSelectors();
    updateEditButtonVisibility();

    // Add click event listener to the "Edit" button
    editInstructionBtn.addEventListener("click", function () {
      const selectedInstructionId = instructionsSelect.value;
      let customInstructions =
        JSON.parse(localStorage.getItem("customInstructions")) || [];
      let instructionIndex = customInstructions.findIndex(
        (instr) => instr.id === selectedInstructionId
      );
      let instruction = customInstructions[instructionIndex];

      if (instruction) {
        ModalModule.showEditInstructionModal(
          TranslationModule.translate("editCustomInstructionTitle"),
          instruction.label,
          instruction.content,
          function (result) {
            if (result) {
              if (result.action === "delete") {
                ModalModule.showCustomConfirm(
                  TranslationModule.translate("confirmDeleteInstruction"),
                  function (confirmDelete) {
                    if (confirmDelete) {
                      // Remove instruction from customInstructions
                      customInstructions.splice(instructionIndex, 1);
                      localStorage.setItem(
                        "customInstructions",
                        JSON.stringify(customInstructions)
                      );

                      // Update instructions and repopulate the select element
                      populateInstructions();
                      instructionsSelect.value = instructions[0].id;
                      ConfigModule.updateConfig({
                        selectedInstructionId: instructions[0].id,
                      });

                      // Update the current chat's selected instruction
                      const currentChat = ChatModule.getCurrentChat();
                      if (currentChat) {
                        currentChat.selectedInstructionId = instructions[0].id;
                        ChatModule.saveChats();
                      }

                      updateEditButtonVisibility();
                    }
                  }
                );
              } else {
                instruction.label = result.label;
                instruction.content = result.content;
                // Update customInstructions in localStorage
                customInstructions[instructionIndex] = instruction;
                localStorage.setItem(
                  "customInstructions",
                  JSON.stringify(customInstructions)
                );

                // Update window.instructions
                let instructionIndexInWindow = window.instructions.findIndex(
                  (instr) => instr.id === selectedInstructionId
                );
                if (instructionIndexInWindow !== -1) {
                  window.instructions[instructionIndexInWindow] = instruction;
                }

                // Update instructions in select element
                populateInstructions();
                instructionsSelect.value = instruction.id;
                updateEditButtonVisibility();
              }
            }
          },
          true
        );
      }
    });

    function updateEditButtonVisibility() {
      const selectedValue = instructionsSelect.value;
      const customInstructions =
        JSON.parse(localStorage.getItem("customInstructions")) || [];
      const isCustomFromMemory = customInstructions.some(
        (instr) => instr.id === selectedValue
      );

      if (isCustomFromMemory) {
        editInstructionBtn.style.display = "inline-block";
      } else {
        editInstructionBtn.style.display = "none";
      }
    }

    // Setup instruction selection change handler
    instructionsSelect.addEventListener("change", function () {
      if (this.value === "custom") {
        ModalModule.showEditInstructionModal(
          TranslationModule.translate("createCustomInstructionTitle"),
          "",
          "",
          function (result) {
            if (result && result.label && result.content) {
              const newInstruction = {
                id: "custom_" + Date.now(),
                label: result.label,
                content: result.content,
              };

              // Get existing customInstructions
              const customInstructions =
                JSON.parse(localStorage.getItem("customInstructions")) || [];
              customInstructions.push(newInstruction);
              localStorage.setItem(
                "customInstructions",
                JSON.stringify(customInstructions)
              );

              // Update instructions in select element
              populateInstructions();
              instructionsSelect.value = newInstruction.id;
              ConfigModule.updateConfig({
                selectedInstructionId: newInstruction.id,
              });

              // Update the current chat's selected instruction
              const currentChat = ChatModule.getCurrentChat();
              if (currentChat) {
                currentChat.selectedInstructionId = newInstruction.id;
                ChatModule.saveChats();
              }

              // Update the edit button visibility
              updateEditButtonVisibility();
            } else {
              instructionsSelect.value =
                ConfigModule.getConfig().selectedInstructionId;
            }
          }
        );
      } else {
        ConfigModule.updateConfig({ selectedInstructionId: this.value });
        // Update the current chat's selected instruction
        const currentChat = ChatModule.getCurrentChat();
        if (currentChat) {
          currentChat.selectedInstructionId = this.value;
          ChatModule.saveChats();
        }
        updateEditButtonVisibility();
      }
    });
  }

  /**
   * Sanitizes user input by escaping special HTML characters.
   * @param {string} input - The user input to sanitize.
   * @returns {string} - The sanitized input.
   */
  function sanitizeUserInput(input) {
    return input.replace(/[&<>"']/g, function (char) {
      const charsToReplace = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return charsToReplace[char] || char;
    });
  }

  function handleSendButtonClick() {
    const userInput = document.getElementById("user-input");
    const rawMessageContent = userInput.value.trim();
    if (rawMessageContent === "") return;

    const messageContent = sanitizeUserInput(rawMessageContent);

    const currentChat = ChatModule.getCurrentChat();
    const selectedModelKey = currentChat.selectedModelKey || "gpt-4o";
    const selectedModelParams = ModelsModule.getModel(selectedModelKey);
    const provider = selectedModelParams.provider;
    const config = ConfigModule.getConfig();
    const providerConfig = config.providerConfigs[provider] || {};

    // Validate provider configuration
    if (provider === "ollama") {
      if (!providerConfig.endpoint) {
        ModalModule.showCustomAlert(
          TranslationModule.translate("pleaseSetEndpoint") + ` (${provider})`
        );
        return;
      }
    } else if (!providerConfig.apiKey) {
      ModalModule.showCustomAlert(
        TranslationModule.translate("pleaseSetApiKey") + ` (${provider})`
      );
      return;
    } else if (provider === "azure" && !providerConfig.endpoint) {
      ModalModule.showCustomAlert(
        TranslationModule.translate("pleaseSetEndpoint") + " (Azure)"
      );
      return;
    }

    MessageModule.sendMessage(messageContent);
    userInput.value = "";
  }

  function handleUserInputKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendButtonClick();
    }
  }

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
        updateModelAndInstructionSelectors();
      } else {
        ModalModule.showCustomAlert("Chat not found.");
      }
    }
  }

  function handleWindowClick(event) {
    if (event.target === document.getElementById("custom-modal")) {
      document.getElementById("custom-modal").style.display = "none";
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
      const providerConfig = config.providerConfigs[provider] || {};

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
              ? '<p style="color: gray; font-size: 0.9em;">This API Key is pre-configured and cannot be edited.</p>'
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
                ? '<p style="color: gray; font-size: 0.9em;">This Endpoint URL is pre-configured and cannot be edited.</p>'
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
    `;
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
        // Handle language change if necessary
      });
    }
  }

  function openSettingsModal() {
    const modalContent = `
      <div class="columns">
        <div class="column is-one-quarter">
          <!-- Left Side Menu -->
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
          <!-- Content Area -->
          <div id="settings-content">
            <!-- Content for the selected tab will be injected here -->
          </div>
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

    // After the modal is displayed, set up tab navigation
    setTimeout(() => {
      const providersTab = document.getElementById("settings-tab-providers");
      const languageTab = document.getElementById("settings-tab-language");
      const dataTab = document.getElementById("settings-tab-data");
      const settingsContent = document.getElementById("settings-content");

      // Function to deactivate all tabs
      function deactivateAllTabs() {
        providersTab.classList.remove("is-active");
        languageTab.classList.remove("is-active");
        dataTab.classList.remove("is-active");
      }

      // Event listener for Providers tab
      providersTab.addEventListener("click", () => {
        deactivateAllTabs();
        providersTab.classList.add("is-active");
        settingsContent.innerHTML = getProvidersContent();
        setupProvidersTabEventListeners();
      });

      // Event listener for Language tab
      languageTab.addEventListener("click", () => {
        deactivateAllTabs();
        languageTab.classList.add("is-active");
        settingsContent.innerHTML = getLanguageContent();
        setupLanguageTabEventListeners();
      });

      // Event listener for Data tab
      dataTab.addEventListener("click", () => {
        deactivateAllTabs();
        dataTab.classList.add("is-active");
        settingsContent.innerHTML = getDataContent();
        setupDataTabEventListeners();
      });

      // Initially display Providers content
      settingsContent.innerHTML = getProvidersContent();
      setupProvidersTabEventListeners();
    }, 0);
  }

  function saveSettings() {
    const config = ConfigModule.getConfig();
    const providerConfigs = config.providerConfigs || {};
    const updatedProviderConfigs = {};

    // Collect provider configurations
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
        if (!providerConfig.apiKey) {
          updatedProviderConfig.apiKey = apiKey;
        }

        // Only update endpoint if it was not provided via providers.js
        if (
          (provider === "azure" || provider === "ollama") &&
          !providerConfig.endpoint
        ) {
          updatedProviderConfig.endpoint = endpoint;
        }

        updatedProviderConfigs[provider] = updatedProviderConfig;
      }
    });

    // Collect language setting
    const languageSelect = document.getElementById("language-select");
    const selectedLanguage = languageSelect
      ? languageSelect.value
      : config.language;

    const theme = document.body.classList.contains("light-mode")
      ? "light-mode"
      : "dark-mode";

    // Update ConfigModule with new configurations
    ConfigModule.updateConfig({
      providerConfigs: updatedProviderConfigs,
      language: selectedLanguage,
      theme,
    });

    TranslationModule.setLanguage(selectedLanguage);
    TranslationModule.applyTranslations();

    ModalModule.showCustomAlert(TranslationModule.translate("settingsSaved"));
  }

  return {
    setupEventListeners,
  };
})();
