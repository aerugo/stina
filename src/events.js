/**
 * Event Module
 * Handles event listeners and event-related functions.
 */
var EventModule = (function () {
  // Module-level variables
  const models = ModelsModule.getModels();
  let editInstructionBtn;
  let instructionsSelect;

  function updateModelAndInstructionSelectors() {
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

    // Populate model selector
    for (const key in models) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = models[key].label;
      modelSelect.appendChild(option);
    }

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
      const customInstructions =
        JSON.parse(localStorage.getItem("customInstructions")) || [];
      const currentChat = ChatModule.getCurrentChat();
      const config = ConfigModule.getConfig();
      const selectedInstructionId =
        (currentChat && currentChat.selectedInstructionId) ||
        config.selectedInstructionId ||
        instructions[0].id;

      instructions.forEach((instruction) => {
        const option = document.createElement("option");
        option.value = instruction.id;
        option.textContent = instruction.label;
        instructionsSelect.appendChild(option);
      });

      customInstructions.forEach((instruction) => {
        addInstructionOption(instruction);
      });

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
      const customInstructions =
        JSON.parse(localStorage.getItem("customInstructions")) || [];
      let instruction = customInstructions.find(
        (instr) => instr.id === selectedInstructionId
      );

      if (instruction) {
        ModalModule.showEditInstructionModal(
          "Redigera anpassad instruktion",
          instruction.label,
          instruction.content,
          function (result) {
            if (result && result.label && result.content) {
              instruction.label = result.label;
              instruction.content = result.content;
              localStorage.setItem(
                "customInstructions",
                JSON.stringify(customInstructions)
              );
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
      if (selectedValue.startsWith("custom_")) {
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
              saveCustomInstruction(newInstruction);
              addInstructionOption(newInstruction);
              instructionsSelect.value = newInstruction.id;
              localStorage.setItem("selectedInstructionId", newInstruction.id);
              updateEditButtonVisibility();
            } else {
              instructionsSelect.value = localStorage.getItem(
                "selectedInstructionId"
              );
              updateEditButtonVisibility();
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
    if (!config.endpoint || !config.apiKey) {
      ModalModule.showCustomAlert(
        "Please set your configuration in the settings before sending messages."
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
        <label class="label">Endpoint URL</label>
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
        <label class="label">API-nyckel</label>
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
    `;

    const buttons = [
      { label: "Avbryt", value: false },
      { label: "Spara ändringar", value: true, class: "is-success" },
    ];

    ModalModule.showCustomModal(
      "Settings",
      modalContent,
      buttons,
      function (result) {
        if (result) {
          saveSettings();
        }
      }
    );
  }

  function saveSettings() {
    const endpoint = document.getElementById("endpoint").value.trim();
    const apiKey = document.getElementById("api-key").value.trim();
    const titleDeployment = document
      .getElementById("title-deployment")
      .value.trim();
    const theme = document.body.classList.contains("light-mode")
      ? "light-mode"
      : "dark-mode";

    if (!endpoint || !apiKey) {
      ModalModule.showCustomAlert("Please fill in all required fields.");
      return;
    }

    ConfigModule.updateConfig({
      endpoint,
      apiKey,
      theme,
      titleDeployment,
    });

    ModalModule.showCustomAlert("Inställningarna har sparats.");
  }

  return {
    setupEventListeners,
    handleSendButtonClick,
    handleUserInputKeyDown,
    handleChatListClick,
    handleWindowClick,
    openSettingsModal,
    saveSettings,
  };
})();
