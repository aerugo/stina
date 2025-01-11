/**
 * Input Module
 * Handles user input processing and modal dialogs
 */
var InputModule = (function () {
  const models = ModelsModule.getModels(); // Retrieve models here
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



  function handleWindowClick(event) {
    if (event.target === document.getElementById("settings-modal")) {
      closeSettingsModal();
    }
    if (event.target === document.getElementById("custom-modal")) {
      document.getElementById("custom-modal").style.display = "none";
    }
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

    const currentState = ChatModule.getCurrentState();
    const newMessage = { role: "user", content: messageContent };
    currentState.conversation.push(newMessage);

    RenderingModule.renderConversation(currentState.conversation);
    MessageModule.saveConversation(
      currentState.currentChatId,
      currentState.conversation
    );
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
        const assistantMessage = await ApiModule.fetchChatCompletion(
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

  return {};
})();
