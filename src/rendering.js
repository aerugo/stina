/**
 * Rendering Module
 * Handles all UI rendering tasks
 */
// Configure marked parser to enable line breaks globally and highlight code
marked.setOptions({
  breaks: true,
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    } else {
      return hljs.highlightAuto(code).value;
    }
  },
});

const RenderingModule = (function () {
  const models = ModelsModule.getModels(); // Retrieve models

  function createMessageElement(message) {
    const messageElem = document.createElement("div");
    messageElem.classList.add(
      message.role === "assistant" ? "assistant-message" : "user-message"
    );

    if (message.role === "assistant") {
      if (message.isLoading) {
        messageElem.innerHTML = `
                    <progress class="progress is-small is-primary" max="100">
                        ${TranslationModule.translate("loading")}...
                    </progress>
                `;
      } else {
        let htmlContent = marked.parse(message.content);
        htmlContent = DOMPurify.sanitize(htmlContent);

        // Create container for assistant message
        const assistantMessageContainer = document.createElement("div");
        assistantMessageContainer.classList.add("assistant-message-container");
        assistantMessageContainer.style.position = "relative";

        // Check if this is the latest assistant message
        const isLatestAssistantMessage = (function () {
          const reversedConversation = ChatModule.getCurrentChat()
            .conversation.slice()
            .reverse();
          for (const msg of reversedConversation) {
            if (msg.role === "assistant") {
              return msg === message;
            }
          }
          return false;
        })();

        // If it's not the latest message, add a class to indicate it's older
        if (!isLatestAssistantMessage) {
          assistantMessageContainer.classList.add("older-message");
        }

        // Create content element
        const articleElem = document.createElement("article");
        articleElem.classList.add("assistant-article");
        articleElem.innerHTML = htmlContent;

        // Create footer for copy button and model/instruction label
        const messageFooter = document.createElement("div");
        messageFooter.classList.add("message-footer");

        // Create the copy button
        const copyButton = document.createElement("button");
        copyButton.classList.add("button", "is-small", "copy-button");
        copyButton.innerHTML = `
                    <span class="icon is-small"><i class="fas fa-copy"></i></span>
                    <span>${TranslationModule.translate("copy")}</span>
                `;

        // Add event listener to copy button
        copyButton.addEventListener("click", () => {
          navigator.clipboard
            .writeText(message.content)
            .then(() => {
              copyButton.innerHTML = TranslationModule.translate("copied");
              setTimeout(() => {
                copyButton.innerHTML = `
                                <span class="icon is-small"><i class="fas fa-copy"></i></span>
                                <span>${TranslationModule.translate(
                                  "copy"
                                )}</span>
                            `;
              }, 2000);
            })
            .catch((err) => {
              console.error(TranslationModule.translate("copy_error"), err);
            });
        });

        // Format the label text
        let labelText = `${message.model || "N/A"}`;
        if (message.instructionLabel) {
          labelText += ` with ${message.instructionLabel}`;
        }

        // Create the top right label (shown on hover)
        const modelInstructionLabelTop = document.createElement("span");
        modelInstructionLabelTop.classList.add("model-instruction-label", "label-top-right");
        modelInstructionLabelTop.textContent = labelText;

        // Append the top label to the assistantMessageContainer
        assistantMessageContainer.appendChild(modelInstructionLabelTop);

        // Append copy button to the footer
        messageFooter.appendChild(copyButton);

        // Create the bottom right label for the latest message
        if (isLatestAssistantMessage) {
          // Add a class to indicate it's the latest message
          assistantMessageContainer.classList.add("latest-message");

          const modelInstructionLabelBottom = document.createElement("span");
          modelInstructionLabelBottom.classList.add("model-instruction-label", "label-bottom-right");
          modelInstructionLabelBottom.textContent = labelText;

          // Append the bottom label to the message footer
          messageFooter.appendChild(modelInstructionLabelBottom);
        }

        // Assemble the assistant message container
        assistantMessageContainer.appendChild(articleElem);
        assistantMessageContainer.appendChild(messageFooter);

        // Append the container to the message element
        messageElem.appendChild(assistantMessageContainer);
      }
    } else {
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("user-message-content");
      contentDiv.innerText = message.content;

      messageElem.appendChild(contentDiv);
    }

    return messageElem;
  }

  function renderConversation(conversation) {
    const chatHistory = document.getElementById("chat-history");
    chatHistory.innerHTML = "";
    conversation.forEach((message) => {
      const messageElem = createMessageElement(message);
      chatHistory.appendChild(messageElem);
    });
    chatHistory.scrollTo({
      top: chatHistory.scrollHeight,
      behavior: "smooth",
    });
  }

  function renderChatList(chats, currentChatId) {
    const chatList = document.getElementById("chat-list");
    chatList.innerHTML = "";
    chats.forEach((chat) => {
      const chatItem = document.createElement("li");
      chatItem.dataset.chatId = chat.id;
      if (chat.id === currentChatId) {
        chatItem.classList.add("active");
      }

      const chatName = document.createElement("span");
      chatName.classList.add("chat-name");
      chatName.innerText = chat.name;

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-chat-btn");
      deleteBtn.innerText = "×";

      chatItem.appendChild(chatName);
      chatItem.appendChild(deleteBtn);
      chatList.appendChild(chatItem);
    });
  }

  return {
    renderConversation,
    renderChatList,
  };
})();
