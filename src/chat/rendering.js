/**
 * Rendering Module
 * Handles all UI rendering tasks
 */
// Create a custom renderer
const renderer = new marked.Renderer();

renderer.code = function (code, infostring, escaped) {
  return CodeBlockComponent.renderCodeBlock(code, infostring);
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

        // Attach code block copy event listener
        CodeBlockComponent.attachCopyEvent(assistantMessageContainer);

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
      // Create a container for user message and any attached files
      const userMessageContainer = document.createElement("div");
      userMessageContainer.classList.add("user-message-container");
      
      // If there are attached files, render them as pills
      if (message.attachedFiles && message.attachedFiles.length > 0) {
        const filesContainer = document.createElement("div");
        filesContainer.classList.add("attached-files-container");
        
        message.attachedFiles.forEach(file => {
          const pill = document.createElement("div");
          pill.classList.add("file-pill");
          if (file.ignored) {
            pill.classList.add("ignored-file");  // Use this CSS class to highlight ignored docs
          }
          pill.innerHTML = `
            <span class="file-name">${DOMPurify.sanitize(file.fileName)}</span>
            <span class="file-classification">${file.classification}</span>
          `;
          
          // Add click event to show file content in a modal
          if (message.attachmentsLocked) {
            // Already sent—read-only view (no ignore toggle)
            pill.addEventListener("click", () => {
              ModalModule.showCustomModal(
                TranslationModule.translate("documentInfoTitle") || "Document Info",
                `<p><strong>${TranslationModule.translate("fileName") || "File"}:</strong> ${DOMPurify.sanitize(file.fileName)}</p>
                 <p><strong>${TranslationModule.translate("classification") || "Classification"}:</strong> ${file.classification}</p>
                 <p><strong>${TranslationModule.translate("tokenCount") || "Token Count"}:</strong> ${file.tokenCount}</p>
                 <hr>
                 <div class="file-content-preview">${DOMPurify.sanitize(file.content)}</div>`,
                [{ label: TranslationModule.translate("ok") || "OK", value: true }]
              );
            });
          } else {
            // Pending attachments—allow toggling the "ignore" state.
            pill.addEventListener("click", () => {
              ModalModule.showCustomModal(
                TranslationModule.translate("documentInfoTitle") || "Document Info",
                `<p><strong>${TranslationModule.translate("fileName") || "File"}:</strong> ${DOMPurify.sanitize(file.fileName)}</p>
                 <p><strong>${TranslationModule.translate("classification") || "Classification"}:</strong> ${file.classification}</p>
                 <p><strong>${TranslationModule.translate("tokenCount") || "Token Count"}:</strong> ${file.tokenCount}</p>
                 <hr>
                 <div class="file-content-preview">${DOMPurify.sanitize(file.content)}</div>
                 <hr>
                 <label class="checkbox" style="margin-top: 1em;">
                   <input type="checkbox" id="ignore-file-checkbox" ${file.ignored ? "checked" : ""} />
                   <span style="margin-left: 0.5rem;">Ignore This Document</span>
                 </label>`,
                [{ label: TranslationModule.translate("ok") || "OK", value: true }],
                () => {
                  const ignoreCheckbox = document.getElementById("ignore-file-checkbox");
                  if (ignoreCheckbox) {
                    file.ignored = ignoreCheckbox.checked;
                    // Re-render the current (pending) conversation section only
                    RenderingModule.renderConversation(ChatModule.getCurrentChat().conversation);
                  }
                }
              );
            });
          }
          
          filesContainer.appendChild(pill);
        });
        
        userMessageContainer.appendChild(filesContainer);
      }
      
      // Add the user message content
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("user-message-content");
      contentDiv.innerText = message.content;
      
      userMessageContainer.appendChild(contentDiv);
      
      // For user messages that include an ignore summary (set when sending), display it
      if (message.ignoredFilesSummary) {
        console.log("[DEBUG][rendering] Rendering ignoredFilesSummary:", message.ignoredFilesSummary);
        const ignoredInfoElem = document.createElement("div");
        ignoredInfoElem.classList.add("ignored-files-summary");
        ignoredInfoElem.innerText = message.ignoredFilesSummary;
        userMessageContainer.appendChild(ignoredInfoElem);
      }
      
      messageElem.appendChild(userMessageContainer);
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
