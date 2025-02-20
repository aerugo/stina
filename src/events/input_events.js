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
    const totalTokens = lastAssistantMessage.usage.total_tokens;
    const remaining = selectedModel.context_length - totalTokens;
    console.log("Remaining tokens:", remaining);
    console.log("Total tokens:", totalTokens);
    console.log("Context length:", selectedModel.context_length);
    if (remaining <= 5000) {
      tokenWarningEl.style.display = "block";
      tokenWarningEl.innerText =
        "Warning: This chat is getting long. The model may not be able to handle more context. Consider starting a new chat.";
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
