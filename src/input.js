/**
 * Input Module
 * Handles user input processing and modal dialogs
 */
var InputModule = (function () {
  function showCustomModal(title, message, buttons, callback) {
    const modal = document.getElementById("custom-modal");
    const titleElem = document.getElementById("custom-modal-title");
    const bodyElem = document.getElementById("custom-modal-body");
    const footerElem = document.getElementById("custom-modal-footer");

    titleElem.textContent = title;
    bodyElem.innerHTML = `<p>${message}</p>`;

    footerElem.innerHTML = "";
    buttons.forEach((button) => {
      const btn = document.createElement("button");
      btn.textContent = button.label;
      btn.addEventListener("click", () => {
        modal.style.display = "none";
        if (callback) callback(button.value);
      });
      footerElem.appendChild(btn);
    });

    modal.style.display = "block";

    const closeButton = document.getElementById("custom-modal-close");
    closeButton.onclick = () => {
      modal.style.display = "none";
      if (callback) callback(null);
    };
  }

  function showCustomAlert(message) {
    showCustomModal("Alert", message, [{ label: "OK", value: true }]);
  }

  function showCustomConfirm(message, callback) {
    const buttons = [
      { label: "Cancel", value: false },
      { label: "OK", value: true },
    ];
    showCustomModal("Confirm", message, buttons, callback);
  }

  function handleSendButtonClick() {
    sendMessage();
  }

  function handleUserInputKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }


  function handleChatListClick(e) {
    const chatName = e.target.closest(".chat-name");
    const deleteBtn = e.target.closest(".delete-chat-btn");
    const chatItem = e.target.closest("li");

    if (!chatItem) return;

    const chatId = chatItem.dataset.chatId;

    if (chatName) {
      const result = ChatModule.loadChat(chatId);
      if (result.success) {
        RenderingModule.renderChatList(
          ChatModule.getCurrentState().chats,
          result.currentChatId
        );
        RenderingModule.renderConversation(result.conversation);
      } else {
        showCustomAlert("Chat not found.");
      }
    } else if (deleteBtn) {
      const chat = ChatModule.getCurrentState().chats.find(
        (c) => c.id === chatId
      );
      showCustomConfirm(
        `Are you sure you want to delete "${chat.name}"? This action cannot be undone.`,
        function (confirmDelete) {
          if (confirmDelete) {
            const state = ChatModule.deleteChat(chatId);
            RenderingModule.renderChatList(state.chats, state.currentChatId);
            RenderingModule.renderConversation(state.conversation);
          }
        }
      );
    }
  }

  function handleWindowClick(event) {
    if (event.target === document.getElementById("settings-modal")) {
      closeSettingsModal();
    }
    if (event.target === document.getElementById("custom-modal")) {
      document.getElementById("custom-modal").style.display = "none";
    }
  }


  function setupEventListeners() {
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const newChatBtn = document.getElementById("new-chat-btn");
    const settingsBtn = document.getElementById("settings-btn");
    const closeSettings = document.getElementById("close-settings");
    const saveSettingsBtn = document.getElementById("save-settings-btn");
    const chatList = document.getElementById("chat-list");

    sendBtn.addEventListener("click", handleSendButtonClick);
    userInput.addEventListener("keydown", handleUserInputKeyDown);
    // New chat button is handled by EventModule
    settingsBtn.addEventListener("click", openSettingsModal);
    closeSettings.addEventListener("click", closeSettingsModal);
    saveSettingsBtn.addEventListener("click", saveSettings);
    chatList.addEventListener("click", handleChatListClick);
    window.addEventListener("click", handleWindowClick);

    // Populate the model selector
    const modelSelect = document.getElementById("model-select");
    for (const key in models) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = models[key].label;
      modelSelect.appendChild(option);
    }

    function saveCustomInstruction(instruction) {
      customInstructions.push(instruction);
      localStorage.setItem(
        "customInstructions",
        JSON.stringify(customInstructions)
      );
    }

    function addInstructionOption(instruction) {
      const option = document.createElement("option");
      option.value = instruction.id;
      option.textContent = instruction.label;
      instructionsSelect.insertBefore(option, instructionsSelect.lastChild);
    }

    // Populate the instructions selector
    const instructionsSelect = document.getElementById("instructions-select");

    function updateEditButtonVisibility() {
      const selectedInstructionId = instructionsSelect.value;
      const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
      const isCustomInstruction = customInstructions.some(
        (instr) => instr.id === selectedInstructionId
      );
      editInstructionBtn.style.display = isCustomInstruction
        ? "inline-block"
        : "none";
    }

    function updateCustomInstruction(id, updatedInstruction) {
      const index = customInstructions.findIndex((instr) => instr.id === id);
      if (index !== -1) {
        customInstructions[index] = { id, ...updatedInstruction };
        localStorage.setItem(
          "customInstructions",
          JSON.stringify(customInstructions)
        );
      }
    }

    function populateInstructions() {
      instructionsSelect.innerHTML = "";
      console.log("Populating Instructions...");

      // Fetch customInstructions and selectedInstructionId from localStorage
      const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
      const selectedInstructionId = localStorage.getItem("selectedInstructionId") || instructions[0].id;
      
      console.log("Default Instructions:", instructions);
      console.log("Custom Instructions:", customInstructions);
      console.log("Selected Instruction ID:", selectedInstructionId);

      // Add default instructions
      instructions.forEach((instruction) => {
        const option = document.createElement("option");
        option.value = instruction.id;
        option.textContent = instruction.label;
        instructionsSelect.appendChild(option);
      });

      // Add custom instructions
      customInstructions.forEach((instruction) => {
        addInstructionOption(instruction);
      });

      // Add the option for creating a new instruction
      const customOption = document.createElement("option");
      customOption.value = "custom";
      customOption.textContent = "Create New Instruction...";
      instructionsSelect.appendChild(customOption);

      // Set the selector to the saved instruction ID
      instructionsSelect.value = selectedInstructionId;

      // Ensure the selected value is valid
      const validOption = instructionsSelect.querySelector(
        `option[value="${selectedInstructionId}"]`
      );
      if (!validOption) {
        // If not valid, default to the first instruction
        selectedInstructionId = instructions[0].id;
        instructionsSelect.value = selectedInstructionId;
        localStorage.setItem("selectedInstructionId", selectedInstructionId);
      }

      // Update the display of the Edit button
      updateEditButtonVisibility();
    }

    // Get reference to edit button
    const editInstructionBtn = document.getElementById("edit-instruction-btn");

    // Add edit button event listener
    editInstructionBtn.addEventListener("click", function () {
      const selectedInstructionId = instructionsSelect.value;
      const instructionToEdit = customInstructions.find(
        (instr) => instr.id === selectedInstructionId
      );
      if (instructionToEdit) {
        showInstructionCreationModal((updatedInstruction) => {
          if (updatedInstruction) {
            updateCustomInstruction(instructionToEdit.id, updatedInstruction);
            populateInstructions();
            instructionsSelect.value = updatedInstruction.id;
            selectedInstructionId = updatedInstruction.id;
            localStorage.setItem(
              "selectedInstructionId",
              selectedInstructionId
            );
            showCustomAlert("Instruction updated successfully.");
          }
        }, instructionToEdit);
      }
    });

    // Initialize instructions
    populateInstructions();

    // Retrieve selectedModelKey from config and set the selected model
    const config = ConfigModule.getConfig();
    const selectedModelKey = config.selectedModelKey || "gpt-4o";
    modelSelect.value = selectedModelKey;

    // Handle visibility of Instructions selector based on selected model
    function updateInstructionsVisibility() {
      const config = ConfigModule.getConfig();
      const currentModelKey = config.selectedModelKey || "gpt-4o";
      const selectedModelParams = models[currentModelKey];
      const instructionsGroup = document.getElementById("instructions-group");

      // Add this check
      if (!selectedModelParams) {
        // Handle the case where the selected model key is invalid
        instructionsGroup.style.display = "none";
        return;
      }

      if (selectedModelParams.system) {
        instructionsGroup.style.display = "flex";
      } else {
        instructionsGroup.style.display = "none";
      }
    }

    // Update selected model when changed
    modelSelect.addEventListener("change", function () {
      const newModelKey = this.value;
      LogicModule.updateSelectedModel(newModelKey);
      console.log("Model changed to:", newModelKey);
      console.log("Model config:", models[newModelKey]);
      updateInstructionsVisibility();
    });

    // Handle creation of new instruction
    instructionsSelect.addEventListener("change", function () {
      if (this.value === "custom") {
        showInstructionCreationModal((newInstruction) => {
          if (newInstruction) {
            saveCustomInstruction(newInstruction);
            addInstructionOption(newInstruction);
            instructionsSelect.value = newInstruction.id;
            selectedInstructionId = newInstruction.id;
            localStorage.setItem(
              "selectedInstructionId",
              selectedInstructionId
            );
            updateEditButtonVisibility();
            
            // Log the creation of new instruction
            console.log("New instruction created:", newInstruction.label);
          } else {
            instructionsSelect.value = selectedInstructionId;
            updateEditButtonVisibility();
          }
        });
      } else {
        selectedInstructionId = this.value;
        localStorage.setItem("selectedInstructionId", selectedInstructionId);
        updateEditButtonVisibility();

        // Log instruction change details
        console.log("Instruction changed to ID:", selectedInstructionId);
        
        // Get all instructions and find the selected one
        const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
        const allInstructions = [...instructions, ...customInstructions];
        const selectedInstruction = allInstructions.find(
            (instr) => instr.id === selectedInstructionId
        );

        if (selectedInstruction) {
            console.log("Instruction changed to:", selectedInstruction.label);
        } else {
            console.log("Instruction not found for ID:", selectedInstructionId);
        }
      }
    });

    function showInstructionCreationModal(callback, instruction = null) {
      const modal = document.getElementById("custom-modal");
      const titleElem = document.getElementById("custom-modal-title");
      const bodyElem = document.getElementById("custom-modal-body");
      const footerElem = document.getElementById("custom-modal-footer");

      titleElem.textContent = instruction
        ? "Edit Custom Instruction"
        : "Create Custom Instruction";

      const titleValue = instruction ? instruction.label : "";
      const contentValue = instruction ? instruction.content : "";

      bodyElem.innerHTML = `
                <div class="input-group">
                    <label for="instruction-title">Title:</label>
                    <input type="text" id="instruction-title" style="width: 100%; padding: 10px; margin-bottom: 10px;" placeholder="Enter instruction title" value="${titleValue}">
                </div>
                <div class="input-group">
                    <label for="instruction-content">Content:</label>
                    <textarea id="instruction-content" rows="5" style="width: 100%; padding: 10px;" placeholder="Enter instruction content">${contentValue}</textarea>
                </div>
            `;

      footerElem.innerHTML = "";

      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Cancel";
      cancelButton.addEventListener("click", () => {
        modal.style.display = "none";
        if (callback) callback(null);
      });

      const saveButton = document.createElement("button");
      saveButton.textContent = "Save";
      saveButton.addEventListener("click", () => {
        const title = document.getElementById("instruction-title").value.trim();
        const content = document
          .getElementById("instruction-content")
          .value.trim();
        if (title && content) {
          const newInstruction = {
            id: instruction ? instruction.id : "custom_" + Date.now(),
            label: title,
            content: content,
          };
          modal.style.display = "none";
          if (callback) callback(newInstruction);
        } else {
          showCustomAlert(
            "Please provide both a title and content for the instruction."
          );
        }
      });

      footerElem.appendChild(cancelButton);
      footerElem.appendChild(saveButton);

      modal.style.display = "block";
      document.getElementById("instruction-title").focus();
    }

    // Initialize instructions visibility
    updateInstructionsVisibility();

    // Initialize theme on page load
    const storedTheme = ConfigModule.getConfig().theme || "light-mode";
    applyTheme(storedTheme);
  }

  async function sendMessage() {
    const userInput = document.getElementById("user-input");
    const messageContent = userInput.value.trim();
    if (messageContent === "") return;

    const config = ConfigModule.getConfig();
    if (!config.endpoint || !config.apiKey) {
      showCustomAlert(
        "Please set your configuration in the settings before sending messages."
      );
      return;
    }

    const currentState = LogicModule.getCurrentState();
    const newMessage = { role: "user", content: messageContent };
    currentState.conversation.push(newMessage);

    RenderingModule.renderConversation(currentState.conversation);
    LogicModule.saveConversation();
    userInput.value = "";

    // Get the selected model parameters
    const selectedModelKey = config.selectedModelKey || "gpt-4o";
    const selectedModelParams = models[selectedModelKey];
    console.log("Selected Model:", selectedModelKey, selectedModelParams);

    // Start with a copy of the conversation WITHOUT the loading message
    let conversationToSend = [...currentState.conversation];
    let instruction = null;
    let instructionLabel = "";

      // Add system message if model supports it
      if (selectedModelParams && selectedModelParams.system) {
        console.log("Model supports system messages");
        
        // Get latest instruction ID and custom instructions
        const selectedInstructionId = localStorage.getItem("selectedInstructionId") || instructions[0].id;
        const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
        console.log("Selected Instruction ID:", selectedInstructionId);
        
        // Find selected instruction
        instruction = customInstructions.find(instr => instr.id === selectedInstructionId) ||
                     instructions.find(instr => instr.id === selectedInstructionId);

        if (!instruction) {
          console.warn("Instruction not found for ID:", selectedInstructionId);
          instruction = instructions[0]; // Fallback to default instruction
        }

        console.log("Using instruction:", instruction.label);
        instructionLabel = instruction.label;

        // Prepend system message to conversationToSend
        conversationToSend.unshift({ role: "system", content: instruction.content });
        console.log("Added system message:", instruction.content);
      } else {
        console.log("Model does not support system messages");
      }

      // Add the loading message to the conversation for rendering only
      const loadingMessage = { role: "assistant", content: "", isLoading: true };
      currentState.conversation.push(loadingMessage);
      RenderingModule.renderConversation(currentState.conversation);

      console.log("Final conversation to send:", conversationToSend);

      // Estimate total tokens and truncate conversation if necessary
      const context_length = selectedModelParams.context_length || 4096;
      const maxAllowedTokens = context_length;

      // Function to estimate tokens
      function estimateTokens(text) {
        // Simple approximation: 1 token is approximately 4 characters
        return Math.ceil(text.length / 4);
      }

      // Estimate tokens for each message
      let totalTokens = 0;
      let truncatedConversation = [];
      for (let i = conversationToSend.length - 1; i >= 0; i--) {
        const message = conversationToSend[i];
        const messageTokens = estimateTokens(message.content) + 10; // Add buffer for role and formatting
        if (totalTokens + messageTokens > maxAllowedTokens) {
          break;
        }
        totalTokens += messageTokens;
        truncatedConversation.unshift(message);
      }

      // Warn the user if messages were removed
      if (truncatedConversation.length < conversationToSend.length) {
        console.warn(
          "Context is too long. Older messages have been truncated."
        );
        showCustomAlert(
          "The conversation is too long. Older messages have been truncated."
        );
      }

      try {
        const assistantMessage = await LogicModule.fetchAzureOpenAIChatCompletion(
          conversationToSend,
          selectedModelParams.deployment,
          {
            temperature: selectedModelParams.temperature,
            max_tokens: selectedModelParams.max_tokens,
            frequency_penalty: selectedModelParams.frequency_penalty,
            presence_penalty: selectedModelParams.presence_penalty,
            stop: selectedModelParams.stop
          }
        );

        // Add metadata to the assistant message
        const enrichedMessage = {
          ...assistantMessage,
          model: selectedModelKey,
          instructionLabel: instruction ? instruction.label : ""
        };

        // Replace the loading message with the actual assistant message
        currentState.conversation[currentState.conversation.length - 1] = enrichedMessage;
        RenderingModule.renderConversation(currentState.conversation);
        LogicModule.saveConversation();

        // Check if the chat title needs updating
        const chat = LogicModule.getCurrentChat();
        if (chat.name === "New chat") {
          // Generate a title based on the first user message
          const title = await MessageModule.generateChatTitle(messageContent);
          ChatModule.updateChatTitle(chat.id, title);
          RenderingModule.renderChatList(
            ChatModule.getCurrentState().chats,
            currentState.currentChatId
          );
        }
      } catch (error) {
      // Remove the loading message
      currentState.conversation.pop();
      RenderingModule.renderConversation(currentState.conversation);
      console.error("Error:", error);
      showCustomAlert(
        "An error occurred while communicating with the Azure OpenAI API. Check the console for details."
      );
    }
  }

  function openSettingsModal() {
    const config = ConfigModule.getConfig();
    document.getElementById("endpoint").value = config.endpoint;
    document.getElementById("api-key").value = config.apiKey;
    document.getElementById("title-deployment").value =
      config.titleDeployment || "";
    // Set the theme radio button based on the current theme
    const themeRadios = document.getElementsByName("theme");
    themeRadios.forEach((radio) => {
      radio.checked = radio.value === (config.theme || "light-mode");
    });
    document.getElementById("settings-modal").style.display = "block";
  }

  function applyTheme(theme) {
    document.body.classList.remove("light-mode", "dark-mode");
    document.body.classList.add(theme);
  }

  function closeSettingsModal() {
    document.getElementById("settings-modal").style.display = "none";
  }

  function saveSettings() {
    const endpoint = document.getElementById("endpoint").value.trim();
    const apiKey = document.getElementById("api-key").value.trim();
    const titleDeployment = document
      .getElementById("title-deployment")
      .value.trim();
    // Retrieve the selected theme from the radio buttons
    let theme = "light-mode"; // Default theme
    const themeRadios = document.getElementsByName("theme");
    themeRadios.forEach((radio) => {
      if (radio.checked) {
        theme = radio.value;
      }
    });

    if (!endpoint || !apiKey) {
      showCustomAlert("Please fill in all fields.");
      return;
    }

    ConfigModule.updateConfig({
      endpoint,
      apiKey,
      theme,
      titleDeployment
    });
    applyTheme(theme);
    showCustomAlert("Settings saved successfully.");
    closeSettingsModal();
  }

  function showInputModal(title, message, defaultValue, callback) {
    const modal = document.getElementById("custom-modal");
    const titleElem = document.getElementById("custom-modal-title");
    const bodyElem = document.getElementById("custom-modal-body");
    const footerElem = document.getElementById("custom-modal-footer");

    titleElem.textContent = title;

    bodyElem.innerHTML = `
            <p>${message}</p>
            <input type="text" id="modal-input" style="width: 100%; padding: 10px; margin-top: 10px;" value="${defaultValue}">
        `;

    footerElem.innerHTML = "";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => {
      modal.style.display = "none";
      if (callback) callback(null);
    });

    const okButton = document.createElement("button");
    okButton.textContent = "OK";
    okButton.addEventListener("click", () => {
      const inputValue = document.getElementById("modal-input").value;
      modal.style.display = "none";
      if (callback) callback(inputValue.trim() !== "" ? inputValue : null);
    });

    footerElem.appendChild(cancelButton);
    footerElem.appendChild(okButton);

    modal.style.display = "block";

    // Set focus to the input field
    const inputField = document.getElementById("modal-input");
    inputField.focus();

    // Handle Enter key to submit
    inputField.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        okButton.click();
      }
    });

    // Close modal when clicking the close button
    const closeButton = document.getElementById("custom-modal-close");
    closeButton.onclick = () => {
      modal.style.display = "none";
      if (callback) callback(null);
    };
  }

  return {
    setupEventListeners,
    showCustomAlert,
    showCustomConfirm,
    showInputModal,
  };
})();
