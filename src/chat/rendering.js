/**
 * Rendering Module
 * Handles all UI rendering tasks
 */
// Create a custom renderer
const renderer = new marked.Renderer();

renderer.code = function (code, infostring, escaped) {
  const language = (infostring || "").match(/\S*/)[0];

  // Log the code and its type for debugging
  console.log("Code before processing:", code, "Type:", typeof code);

  // Ensure code is a string
  if (typeof code !== "string") {
    console.warn("Expected code to be a string but got:", typeof code);
    if (code && (code.raw || code.text)) {
      code = code.raw || code.text;
    } else {
      code = String(code);
    }
  }

  let highlighted = "";
  try {
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(code, { language: language }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }
  } catch (error) {
    console.error("Error highlighting code:", error);
    highlighted = code; // Fallback to unhighlighted code
  }

  // Sanitize the highlighted code
  const sanitizedHighlighted = DOMPurify.sanitize(highlighted);

  // Generate a unique ID for each code block
  const codeBlockId = "code-block-" + Math.random().toString(36).substr(2, 9);

  // Return the custom HTML for the code block with a copy button
  return `
    <div class="code-block-container">
      <button class="copy-code-button" data-code-block-id="${codeBlockId}">
        <img src="src/icons/copy.svg" alt="${TranslationModule.translate(
          "copy"
        )}" />
      </button>
      <pre><code id="${codeBlockId}" class="hljs ${
    language || ""
  }">${sanitizedHighlighted}</code></pre>
    </div>
  `;
};

// Configure marked parser to enable line breaks globally and use custom renderer
marked.setOptions({
  breaks: true,
  renderer: renderer,
});

const RenderingModule = (function () {
  const models = ModelsModule.getModels(); // Retrieve models

  function createMessageElement(message) {
    if (typeof message.content !== "string") {
      console.warn("message.content is not a string:", message.content);
      message.content = JSON.stringify(message.content);
    }
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

        // Create content element
        const articleElem = document.createElement("article");
        articleElem.classList.add("assistant-article");
        articleElem.innerHTML = htmlContent;

        // Add event listener for copy buttons inside code blocks
        assistantMessageContainer.addEventListener("click", function (event) {
          const target = event.target;
          if (target.closest(".copy-code-button")) {
            const button = target.closest(".copy-code-button");
            const codeBlockId = button.getAttribute("data-code-block-id");
            const codeBlock = document.getElementById(codeBlockId);

            if (codeBlock) {
              // Get the code text without HTML tags
              const codeText = codeBlock.textContent;

              navigator.clipboard
                .writeText(codeText)
                .then(() => {
                  button.innerHTML = `
                  <img src="src/icons/copy.svg" alt="${TranslationModule.translate(
                    "copied"
                  )}" />
                  <span>${TranslationModule.translate("copied")}</span>
                `;
                  setTimeout(() => {
                    button.innerHTML = `
                    <img src="src/icons/copy.svg" alt="${TranslationModule.translate(
                      "copy"
                    )}" />
                    <span>${TranslationModule.translate("copy")}</span>
                  `;
                  }, 2000);
                })
                .catch((err) => {
                  console.error(TranslationModule.translate("copy_error"), err);
                });
            }
          }
        });

        // Create footer for copy button and model/instruction label
        const messageFooter = document.createElement("div");
        messageFooter.classList.add("message-footer");

        // Create the copy button
        const copyButton = document.createElement("button");
        copyButton.classList.add("button", "is-small", "copy-button");
        const originalCopyButtonHTML = `
                    <span class="icon is-small">
                        <img src="src/icons/copy.svg" alt="${TranslationModule.translate(
                          "copy"
                        )}" />
                    </span>
                    <span>${TranslationModule.translate("copy")}</span>
                `;
        copyButton.innerHTML = originalCopyButtonHTML;

        // Add event listener to copy button
        copyButton.addEventListener("click", () => {
          navigator.clipboard
            .writeText(message.content)
            .then(() => {
              copyButton.innerHTML = `
                    <span class="icon is-small">
                        <img src="src/icons/copy.svg" alt="${TranslationModule.translate(
                          "copied"
                        )}" />
                    </span>
                    <span>${TranslationModule.translate("copied")}</span>
                `;
              setTimeout(() => {
                copyButton.innerHTML = originalCopyButtonHTML;
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
        modelInstructionLabelTop.classList.add(
          "model-instruction-label",
          "label-top-right"
        );
        modelInstructionLabelTop.textContent = labelText;

        // Append the top label to the assistantMessageContainer
        assistantMessageContainer.appendChild(modelInstructionLabelTop);

        // Append copy button to the footer
        messageFooter.appendChild(copyButton);

        // Create the bottom right label (always visible)
        const modelInstructionLabelBottom = document.createElement("span");
        modelInstructionLabelBottom.classList.add(
          "model-instruction-label",
          "label-bottom-right"
        );
        modelInstructionLabelBottom.textContent = labelText;

        // Append the bottom label to the message footer
        messageFooter.appendChild(modelInstructionLabelBottom);

        // Assemble the assistant message container
        assistantMessageContainer.appendChild(articleElem);
        assistantMessageContainer.appendChild(messageFooter);

        // Append the container to the message element
        messageElem.appendChild(assistantMessageContainer);

        // Determine if this is an older message
        const conversation = ChatModule.getCurrentChat().conversation;
        const isOlderMessage =
          !message.isLoading &&
          message !== conversation[conversation.length - 1];

        // If it's an older message, add a class
        if (isOlderMessage) {
          assistantMessageContainer.classList.add("older-message");
        }
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
      chatName.textContent = chat.name;

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
