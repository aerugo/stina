/**
 * Event Module
 * Handles event listeners and event-related functions.
 */
var EventModule = (function () {
  let editInstructionBtn;
  let instructionsSelect;

  // Function to populate model selector based on provider
  function populateModelSelector(selectedProvider) {
    const models = ModelsModule.getModels();
    const modelSelect = document.getElementById("model-select");
    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();

    // Clear existing options
    modelSelect.innerHTML = "";

    // Filter models based on the selected provider
    const filteredModels = Object.entries(models).filter(
      ([_, model]) => model.provider === selectedProvider
    );

    // Check if there are models for the selected provider
    if (filteredModels.length === 0) {
      console.warn(`No models available for provider: ${selectedProvider}`);
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
    const savedModelKey = currentChat?.selectedModelKey || config.selectedModelKey;

    if (savedModelKey && models[savedModelKey]?.provider === selectedProvider) {
      modelSelect.value = savedModelKey;
    } else {
      // Default to the first model for the selected provider
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
    populateModelSelector(config.provider || 'azure');

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
      const selectedInstructionId =
        (currentChat && currentChat.selectedInstructionId) ||
        config.selectedInstructionId ||
        window.instructions[0]?.id;

      // Debug logging
      console.log("populateInstructions - window.instructions:", window.instructions);

      // Check if window.instructions exists and has instructions
      if (!window.instructions || window.instructions.length === 0) {
        console.error("No instructions available");
        return;
      }

      // Loop through all instructions in window.instructions and add them to select element
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
      let customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
      let instructionIndex = customInstructions.findIndex(
        (instr) => instr.id === selectedInstructionId
      );
      let instruction = customInstructions[instructionIndex];

      if (instruction) {
        ModalModule.showEditInstructionModal(
          "Redigera anpassad instruktion",
          instruction.label,
          instruction.content,
          function (result) {
            if (result && result.label && result.content) {
              instruction.label = result.label;
              instruction.content = result.content;
              // Update customInstructions in localStorage
              customInstructions[instructionIndex] = instruction;
              localStorage.setItem("customInstructions", JSON.stringify(customInstructions));

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
      const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
      const isCustomFromMemory = customInstructions.some(instr => instr.id === selectedValue);

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
          "Skapa anpassad instruktion",
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
              const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
              customInstructions.push(newInstruction);
              localStorage.setItem("customInstructions", JSON.stringify(customInstructions));

              // Update window.instructions
              window.instructions.push(newInstruction);

              // Update instructions in select element
              populateInstructions();
              instructionsSelect.value = newInstruction.id;
              ConfigModule.updateConfig({ selectedInstructionId: newInstruction.id });
            } else {
              instructionsSelect.value = ConfigModule.getConfig().selectedInstructionId;
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

    const config = ConfigModule.getConfig();
    // Adjust validation based on provider
    if (config.provider === 'ollama') {
      // No API Key or Endpoint required for Ollama
    } else if (config.provider === 'openai' || config.provider === 'anthropic') {
      // Only API Key is required for OpenAI and Anthropic
      if (!config.apiKey) {
        ModalModule.showCustomAlert(
          TranslationModule.translate('pleaseSetConfiguration')
        );
        return;
      }
      // Endpoint is not required; proceed without checking it
    } else if (config.provider === 'azure') {
      // Both API Key and Endpoint are required for Azure
      if (!config.apiKey || !config.endpoint) {
        ModalModule.showCustomAlert(
          TranslationModule.translate('pleaseSetConfiguration')
        );
        return;
      }
    } else {
      // Handle other providers or unknown provider
      ModalModule.showCustomAlert(
        TranslationModule.translate('pleaseSetConfiguration')
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
    const modalContent = `
      <div class="field">
        <label class="label">${TranslationModule.translate('endpointURL')}</label>
        <div class="control">
          <input
            class="input"
            type="text"
            id="endpoint"
            placeholder="https://YOUR_RESOURCE_NAME.openai.azure.com"
            value="${config.endpoint || ""}"
          />
        </div>
      </div>
      <div class="field">
        <label class="label">${TranslationModule.translate('apiKey')}</label>
        <div class="control">
          <input 
            class="input" 
            type="password" 
            id="api-key" 
            placeholder="YOUR_API_KEY" 
            value="${config.apiKey || ""}"
          />
        </div>
      </div>
      <div class="field">
        <label class="label">${TranslationModule.translate('provider')}</label>
        <div class="control">
          <div class="select">
            <select id="provider-select">
              <option value="azure"${config.provider === 'azure' ? ' selected' : ''}>${TranslationModule.translate('azure')}</option>
              <option value="openai"${config.provider === 'openai' ? ' selected' : ''}>${TranslationModule.translate('openai')}</option>
              <option value="anthropic"${config.provider === 'anthropic' ? ' selected' : ''}>${TranslationModule.translate('anthropic')}</option>
              <option value="ollama"${config.provider === 'ollama' ? ' selected' : ''}>${TranslationModule.translate('ollama')}</option>
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="label">${TranslationModule.translate('language')}</label>
        <div class="control">
          <div class="select">
            <select id="language-select">
              <option value="en"${config.language === 'en' ? ' selected' : ''}>${TranslationModule.translate('english')}</option>
              <option value="sv"${config.language === 'sv' ? ' selected' : ''}>${TranslationModule.translate('swedish')}</option>
            </select>
          </div>
        </div>
      </div>
    `;

    const buttons = [
      { label: TranslationModule.translate('cancel'), value: false },
      { label: TranslationModule.translate('saveChanges'), value: true, class: "is-success" },
    ];

    ModalModule.showCustomModal(
      TranslationModule.translate('settings'),
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
      const providerSelect = document.getElementById('provider-select');
      const apiKeyField = document.getElementById('api-key');
      const endpointField = document.getElementById('endpoint');

      function updateFields() {
        const endpointFieldContainer = endpointField.closest('.field');
        const selectedProvider = providerSelect.value;
        const isProviderConfigured = config.providerConfigs.hasOwnProperty(selectedProvider);
        const providerConfig = config.providerConfigs[selectedProvider] || {};

        if (isProviderConfigured) {
          // Provider is pre-configured
          apiKeyField.disabled = true;
          apiKeyField.value = providerConfig.apiKey || '';
          apiKeyField.placeholder = 'Pre-configured';

          if (providerConfig.endpoint) {
            endpointField.disabled = true;
            endpointField.value = providerConfig.endpoint;
            endpointField.placeholder = 'Pre-configured';
            endpointFieldContainer.style.display = 'block';
          } else {
            endpointFieldContainer.style.display = 'none';
          }

          // Add message about pre-configured settings if not already present
          const existingMessage = document.querySelector('.pre-configured-message');
          if (!existingMessage) {
            const messageElem = document.createElement('p');
            messageElem.className = 'pre-configured-message';
            messageElem.textContent = 'Some settings are pre-configured and cannot be edited.';
            messageElem.style.color = '#888';
            endpointFieldContainer.parentNode.insertBefore(messageElem, endpointFieldContainer);
          }
        } else if (selectedProvider === 'ollama') {
          // Hide Endpoint field for Ollama
          endpointFieldContainer.style.display = 'none';
          // Disable API Key field for Ollama
          apiKeyField.disabled = true;
          apiKeyField.placeholder = 'Not required for Ollama';
          apiKeyField.value = ''; // Clear value
        } else if (selectedProvider === 'openai' || selectedProvider === 'anthropic') {
          // Hide Endpoint field for OpenAI and Anthropic
          endpointFieldContainer.style.display = 'none';
          // Enable API Key field
          apiKeyField.disabled = false;
          apiKeyField.placeholder = 'YOUR_API_KEY';
        } else {
          // Show Endpoint field for other providers
          endpointFieldContainer.style.display = 'block';
          endpointField.placeholder = 'https://YOUR_RESOURCE_NAME.openai.azure.com';
          // Enable API Key field
          apiKeyField.disabled = false;
          apiKeyField.placeholder = 'YOUR_API_KEY';
        }
        
        // Update the model selector with the new provider
        populateModelSelector(providerSelect.value);
      }

      providerSelect.addEventListener('change', updateFields);
      updateFields(); // Initialize fields based on current provider
    }, 0);
  }

  function saveSettings() {
    const selectedProvider = document.getElementById('provider-select').value;
    const config = ConfigModule.getConfig();
    const isProviderConfigured = config.providerConfigs.hasOwnProperty(selectedProvider);
    
    let endpoint = document.getElementById("endpoint").value.trim();
    const apiKey = document.getElementById("api-key").value.trim();
    const selectedLanguage = document.getElementById('language-select').value;
    const theme = document.body.classList.contains("light-mode")
      ? "light-mode" 
      : "dark-mode";

    // Adjust validation based on provider
    if (selectedProvider === 'ollama') {
      // No API Key or Endpoint required for Ollama
      endpoint = ''; // Clear endpoint
    } else if ((selectedProvider === 'openai' || selectedProvider === 'anthropic') && !apiKey) {
      ModalModule.showCustomAlert(TranslationModule.translate('pleaseFillRequiredFields'));
      return;
    } else if (selectedProvider === 'azure' && (!apiKey || !endpoint)) {
      ModalModule.showCustomAlert(TranslationModule.translate('pleaseFillRequiredFields'));
      return;
    }

    // For OpenAI, clear endpoint to use default
    if (selectedProvider === 'openai') {
      endpoint = ''; // Clear endpoint to use default OpenAI API endpoint
    }

    // Only save endpoint and apiKey if provider is not pre-configured
    if (!isProviderConfigured) {
      ConfigModule.updateConfig({
        endpoint,
        apiKey,
      });
    }

    // Always save these settings
    ConfigModule.updateConfig({
      theme,
      language: selectedLanguage,
      provider: selectedProvider,
    });

    TranslationModule.setLanguage(selectedLanguage);
    TranslationModule.applyTranslations();

    // Update the model selector based on the new provider
    populateModelSelector(selectedProvider);

    ModalModule.showCustomAlert(TranslationModule.translate('settingsSaved'));
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
