/**
 * Input Events Module
 * Handles events related to user input and message sending.
 */
const InputEventsModule = (function () {
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

  function setupEventListeners() {
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    // Add auto-resize functionality for textarea
    userInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });

    userInput.addEventListener("keydown", handleUserInputKeyDown);
    sendBtn.addEventListener("click", handleSendButtonClick);
  }

  return {
    setupEventListeners,
  };
})();
