/**
 * Input Events Module
 * Handles events related to user input and message sending.
 */
const InputEventsModule = (function () {
  function checkTokenWarning() {
    const tokenWarningEl = document.getElementById("token-warning");
    if (!tokenWarningEl) return;

    const chat = ChatModule.getCurrentChat();
    if (!chat) {
      tokenWarningEl.style.display = "none";
      return;
    }

    // Get the selected model's context length
    const selectedModelKey = chat.selectedModelKey || "gpt-4o";
    const selectedModel = ModelsModule.getModel(selectedModelKey);
    if (!selectedModel || !selectedModel.context_length) {
      tokenWarningEl.style.display = "none";
      return;
    }

    // Find the last assistant message with usage info
    const lastAssistantMessage = [...chat.conversation]
      .reverse()
      .find(
        (m) =>
          m.role === "assistant" &&
          m.usage &&
          typeof m.usage.total_tokens === "number"
      );
    if (!lastAssistantMessage) {
      tokenWarningEl.style.display = "none";
      return;
    }

    // Calculate additional tokens from attached files (excluding ignored ones).
    // - If file.useFullDocument === true, add file.tokenCount.
    // - Else, sum up tokens for each checked summary in file.selectedSummaryIds.
    // - If neither full doc nor any summary is selected, add 0.
    let attachedFilesTokens = 0;

    chat.conversation.forEach((msg) => {
      if (
        msg.role === "user" &&
        msg.attachedFiles &&
        Array.isArray(msg.attachedFiles)
      ) {
        attachedFilesTokens += msg.attachedFiles.reduce((sum, file) => {
          // Skip completely if ignored
          if (file.ignored) {
            return sum;
          }

          if (file.useFullDocument) {
            // Count entire document
            return sum + (file.tokenCount || 0);
          } else if (
            file.selectedSummaryIds &&
            file.selectedSummaryIds.length > 0 &&
            file.summaries
          ) {
            // Sum tokens of each “checked” summary
            let summaryTokens = 0;
            file.selectedSummaryIds.forEach((summaryId) => {
              const summaryObj = file.summaries.find((s) => s.id === summaryId);
              if (summaryObj) {
                summaryTokens += TokenizationModule.countTokens(
                  `[SUMMARY: ${summaryObj.name}]\n\n${summaryObj.content}`
                );
              }
            });
            return sum + summaryTokens;
          } else {
            // Neither full doc nor any summary is selected
            return sum;
          }
        }, 0);
      }
    });

    // Now combine that with the usage from the last assistant message
    const totalTokens =
      lastAssistantMessage.usage.total_tokens + attachedFilesTokens;
    const remaining = selectedModel.context_length - totalTokens;

    // Show warning if fewer than ~5000 tokens remain
    if (remaining <= 5000) {
      tokenWarningEl.style.display = "block";
      tokenWarningEl.innerText =
        TranslationModule.translate("tokenLengthWarning");
    } else {
      tokenWarningEl.style.display = "none";
    }
  }

  function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function insertTextAtCursor(text) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function handleSendButtonClick() {
    const userInput = document.getElementById("user-input");
    const rawMessageContent = userInput.value.trim();
    if (rawMessageContent === "") return;

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

    MessageModule.sendMessage(rawMessageContent);
    userInput.value = "";
    userInput.style.height = "auto";
  }

  function handleUserInputKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendButtonClick();
    }
  }

  function setupEventListeners() {
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    // Add auto-resize functionality for textarea
    userInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
      // Ensure token check runs on every input event
      checkTokenWarning();
    });

    userInput.addEventListener("keydown", handleUserInputKeyDown);
    sendBtn.addEventListener("click", handleSendButtonClick);
  }

  return {
    setupEventListeners,
    checkTokenWarning,
  };
})();
