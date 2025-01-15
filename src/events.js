/**
 * Event Module
 * Handles event listeners and event-related functions.
 */
var EventModule = (function () {
  let editInstructionBtn;
  let instructionsSelect;

  // Function to populate model selector based on provider
  function populateModelSelector() {
    const models = ModelsModule.getModels();
    const modelSelect = document.getElementById("model-select");
    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();
    const enabledProviders = Object.keys(config.providerConfigs || {});

    // Clear existing options
    modelSelect.innerHTML = "";

    // Filter models based on enabled providers
    const filteredModels = Object.entries(models).filter(
      ([_, model]) => enabledProviders.includes(model.provider)
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

    function addInstructionOption(instruction) {
      const option = document.createElement("option");
      option.value = instruction.id;
      option.textContent = instruction.label;
      instructionsSelect.insertBefore(option, instructionsSelect.lastChild);
    }

    function saveCustomInstruction(instruction) {
      const customInstructions =
        JSON.parse(localStorage.getItem("customInstructions")) || [];
      customInstructions.push(instruction);
      localStorage.setItem(
        "customInstructions",
        JSON.stringify(customInstructions)
      );
    }

    function populateInstructions() {
      instructionsSelect.innerHTML = "";
      const currentChat = ChatModule.getCurrentChat();
      const config = ConfigModule.getConfig();

      // Get custom instructions from localStorage
      const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];

      // Combine defaultInstructions and customInstructions
      window.instructions = window.defaultInstructions.concat(customInstructions);

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
      customOption.textContent = "Skapa ny instruktion...";
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
            if (result && result.label && result.content) {
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

  function handleSendButtonClick() {
    const userInput = document.getElementById("user-input");
    const messageContent = userInput.innerText.trim();
    if (messageContent === "") return;

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

    ControllerModule.sendMessage(messageContent);
    userInput.innerText = "";
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

  function openSettingsModal() {
    const config = ConfigModule.getConfig();
    const enabledProviders = Object.keys(config.providerConfigs || {});

    let modalContent = '';

    enabledProviders.forEach((provider) => {
      const providerConfig = config.providerConfigs[provider] || {};
      modalContent += `
        <div class="field">
          <label class="label">${TranslationModule.translate('apiKey')} (${provider})</label>
          <div class="control">
            <input
              class="input"
              type="password"
              id="api-key-${provider}"
              placeholder="${TranslationModule.translate('enterApiKey')}"
              value="${providerConfig.apiKey || ''}"
            />
          </div>
        </div>
      `;

      // Include Endpoint field if the provider requires it
      if (provider === 'azure' || provider === 'ollama') {
        modalContent += `
          <div class="field">
            <label class="label">${TranslationModule.translate('endpointURL')} (${provider})</label>
            <div class="control">
              <input
                class="input"
                type="text"
                id="endpoint-${provider}"
                placeholder="${provider === 'azure' ? 'https://YOUR_RESOURCE_NAME.openai.azure.com' : 'http://localhost:11434'}"
                value="${providerConfig.endpoint || ''}"
              />
            </div>
          </div>
        `;
      }
    });

    modalContent += `
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

    // After the modal is displayed, add event listeners to update fields
    setTimeout(() => {
      const providerSelect = document.getElementById("provider-select");
      const apiKeyField = document.getElementById("api-key");
      const endpointField = document.getElementById("endpoint");

      function updateFields() {
        const endpointFieldContainer = endpointField.closest(".field");
        const apiKeyFieldContainer = apiKeyField.closest(".field");
        const selectedProvider = providerSelect.value;
        const isProviderConfigured =
          config.providerConfigs.hasOwnProperty(selectedProvider);
        const providerConfig = config.providerConfigs[selectedProvider] || {};

        if (selectedProvider === "ollama") {
          // Show Endpoint field and set placeholder
          endpointFieldContainer.style.display = "block";
          endpointField.placeholder = "http://localhost:11434";
          endpointField.disabled = false;

          // Hide API Key field for Ollama
          apiKeyFieldContainer.style.display = "none";
        } else if (isProviderConfigured) {
          // Provider is pre-configured
          apiKeyField.disabled = true;
          apiKeyField.value = providerConfig.apiKey || "";
          apiKeyField.placeholder = "Pre-configured";

          if (providerConfig.endpoint) {
            endpointField.disabled = true;
            endpointField.value = providerConfig.endpoint;
            endpointField.placeholder = "Pre-configured";
            endpointFieldContainer.style.display = "block";
          } else {
            endpointFieldContainer.style.display = "none";
          }

          // Add message about pre-configured settings if not already present
          const existingMessage = document.querySelector(
            ".pre-configured-message"
          );
          if (!existingMessage) {
            const messageElem = document.createElement("p");
            messageElem.className = "pre-configured-message";
            messageElem.textContent =
              "Some settings are pre-configured and cannot be edited.";
            messageElem.style.color = "#888";
            endpointFieldContainer.parentNode.insertBefore(
              messageElem,
              endpointFieldContainer
            );
          }
        } else if (selectedProvider === "ollama") {
          // Hide Endpoint field for Ollama
          endpointFieldContainer.style.display = "none";
          // Disable API Key field for Ollama
          apiKeyField.disabled = true;
          apiKeyField.placeholder = "Not required for Ollama";
          apiKeyField.value = ""; // Clear value
        } else if (
          selectedProvider === "openai" ||
          selectedProvider === "anthropic"
        ) {
          // Hide Endpoint field for OpenAI and Anthropic
          endpointFieldContainer.style.display = "none";
          // Enable API Key field
          apiKeyField.disabled = false;
          apiKeyField.placeholder = "YOUR_API_KEY";
        } else {
          // Show Endpoint field for other providers
          endpointFieldContainer.style.display = "block";
          endpointField.placeholder =
            "https://YOUR_RESOURCE_NAME.openai.azure.com";
          // Enable API Key field
          apiKeyField.disabled = false;
          apiKeyField.placeholder = "YOUR_API_KEY";
        }

        // Update the model selector with the new provider
        populateModelSelector(providerSelect.value);
      }

      providerSelect.addEventListener("change", updateFields);
      updateFields(); // Initialize fields based on current provider
    }, 0);
  }

  function saveSettings() {
    const config = ConfigModule.getConfig();
    const enabledProviders = Object.keys(config.providerConfigs || {});
    const providerConfigs = {};

    enabledProviders.forEach((provider) => {
      const apiKey = document.getElementById(`api-key-${provider}`).value.trim();
      let endpoint = '';

      if (provider === 'azure' || provider === 'ollama') {
        endpoint = document.getElementById(`endpoint-${provider}`).value.trim();
      }

      providerConfigs[provider] = {
        apiKey,
        endpoint,
      };
    });

    const selectedLanguage = document.getElementById("language-select").value;
    const theme = document.body.classList.contains("light-mode")
      ? "light-mode"
      : "dark-mode";

    // Update ConfigModule with new provider configurations
    ConfigModule.updateConfig({
      providerConfigs,
      language: selectedLanguage,
      theme,
    });

    TranslationModule.setLanguage(selectedLanguage);
    TranslationModule.applyTranslations();

    ModalModule.showCustomAlert(TranslationModule.translate("settingsSaved"));
  }

  return {
    setupEventListeners,
    handleSendButtonClick,
    handleUserInputKeyDown,
    handleChatListClick,
    handleWindowClick,
    openSettingsModal,
    saveSettings,
    populateModelSelector,
  };
})();
