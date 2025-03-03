/**
 * Rendering Module
 * Handles all UI rendering tasks
 */

/**
 * 1) Marked plugin to treat raw HTML tokens as code blocks
 */
marked.use({
  walkTokens(token) {
    // Always convert any raw HTML token to a code block
    if (token.type === "html") {
      token.type = "code";
      token.lang = "html";
      token.text = token.raw;
    }
  },
});

// 2) Create a custom renderer to handle code blocks
const renderer = new marked.Renderer();
renderer.code = function (code, infostring, escaped) {
  return CodeBlockComponent.renderCodeBlock(code, infostring);
};

// 3) Configure marked parser to enable line breaks globally and use custom renderer
marked.setOptions({
  breaks: true,
  renderer: renderer,
});

/**
 * 4) Utility function to ensure that an HTML document snippet is always fenced.
 *    - Fixes toggling of `insideCodeFence` after inserting fences.
 *    - Uses a more permissive check for triple backticks (trim + startsWith).
 */
function ensureHtmlBlockFencing(text) {
  const lines = text.split(/\r?\n/);

  let i = 0;
  let insideCodeFence = false;

  while (i < lines.length) {
    const trimmedLine = lines[i].trim();

    // Toggle insideCodeFence if we see a line starting with ```
    if (trimmedLine.startsWith("```")) {
      insideCodeFence = !insideCodeFence;
      i++;
      continue;
    }

    // =============================
    // DETECT THE START OF AN HTML BLOCK
    // =============================

    // 1) If NOT inside a code fence and line is <!DOCTYPE html> ...
    //    we look ahead to see if the next non-blank line is <html>.
    if (!insideCodeFence && /<!DOCTYPE html>/i.test(trimmedLine)) {
      let nextNonBlankIndex = i + 1;
      while (
        nextNonBlankIndex < lines.length &&
        !lines[nextNonBlankIndex].trim()
      ) {
        nextNonBlankIndex++;
      }
      // If the very next non-blank line starts with `<html`, we fence above the <!DOCTYPE>
      if (
        nextNonBlankIndex < lines.length &&
        /^<html\b/i.test(lines[nextNonBlankIndex].trim())
      ) {
        // Insert ```html above <!DOCTYPE if it's not already fenced
        let above = i - 1;
        while (above >= 0 && !lines[above].trim()) {
          above--;
        }
        if (above < 0 || !lines[above].trim().startsWith("```")) {
          lines.splice(i, 0, "```html");
          insideCodeFence = true;
          i++;
          // No need to increment i again here, because we still need to pass over
          // the <!DOCTYPE html> line on the next iteration
        }
      }
    }

    // 2) If NOT inside a code fence and the line itself starts with <html> (and wasn't preceded by <!DOCTYPE html>)
    if (!insideCodeFence && /^<html\b/i.test(trimmedLine)) {
      // Check if there's already a ``` fence above (ignoring blank lines)
      let above = i - 1;
      while (above >= 0 && !lines[above].trim()) {
        above--;
      }
      if (above < 0 || !lines[above].trim().startsWith("```")) {
        lines.splice(i, 0, "```html");
        insideCodeFence = true;
        i++;
        // Same reasoning as above: after splice, the current line is still ahead.
      }
    }

    // =============================
    // DETECT THE END OF AN HTML BLOCK
    // =============================

    if (insideCodeFence && /<\/html>/i.test(trimmedLine)) {
      // Look ahead to see if there's already a fence (ignoring blank lines)
      let below = i + 1;
      while (below < lines.length && !lines[below].trim()) {
        below++;
      }
      // If not already a fence, insert one
      if (below >= lines.length || !lines[below].trim().startsWith("```")) {
        lines.splice(i + 1, 0, "```");
        insideCodeFence = false;
        i++;
      }
    }

    i++;
  }

  return lines.join("\n");
}

const RenderingModule = (function () {
  // If not used, consider removing.
  const models = ModelsModule.getModels(); // Retrieve models

  function createMessageElement(message) {
    console.log("Rendering message:", message);

    // If it's an "ignored docs" notice
    if (message.isIgnoredDocsNotice) {
      const noticeElem = document.createElement("div");
      noticeElem.classList.add("ignored-docs-notice");
      noticeElem.textContent = message.content;
      return noticeElem;
    }

    if (typeof message.content !== "string") {
      console.warn("message.content is not a string:", message.content);
      message.content = JSON.stringify(message.content);
    }

    const messageElem = document.createElement("div");
    messageElem.classList.add(
      message.role === "assistant" ? "assistant-message" : "user-message"
    );

    // --- Assistant message handling ---
    if (message.role === "assistant") {
      if (message.isLoading) {
        messageElem.innerHTML = `
          <progress class="progress is-small is-primary" max="100">
            ${TranslationModule.translate("loading")}...
          </progress>
        `;
      } else {
        // Force any raw HTML snippet into a fenced code block before parsing
        const fencedContent = ensureHtmlBlockFencing(message.content);

        // Convert markdown to HTML
        let htmlContent = marked.parse(fencedContent);

        // Sanitize the HTML
        htmlContent = DOMPurify.sanitize(htmlContent);

        // Create container for assistant message
        const assistantMessageContainer = document.createElement("div");
        assistantMessageContainer.classList.add("assistant-message-container");
        assistantMessageContainer.style.position = "relative";

        // Create content element
        const articleElem = document.createElement("article");
        articleElem.classList.add("assistant-article");
        articleElem.innerHTML = htmlContent;

        // Attach code block copy event listener for individual code blocks
        CodeBlockComponent.attachCopyEvent(assistantMessageContainer);

        // Create footer for copy button and model/instruction label
        const messageFooter = document.createElement("div");
        messageFooter.classList.add("message-footer");

        // Create the "copy entire message" button
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

        // Add event listener to copy entire raw content
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

        // Format the label text (model + instruction label)
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
      // --- User message handling ---
      const userMessageContainer = document.createElement("div");
      userMessageContainer.classList.add("user-message-container");

      // If there are attached files, render them as pills
      if (message.attachedFiles && message.attachedFiles.length > 0) {
        const filesContainer = document.createElement("div");
        filesContainer.classList.add("attached-files-container");

        message.attachedFiles.forEach((file) => {
          const pill = document.createElement("div");
          pill.classList.add("file-pill");

          if (file.ignored) {
            pill.classList.add("ignored-file");
          }
          if (file.selectedSummaryId) {
            pill.classList.add("summary-active");
          }

          // If summary is active, show summary title instead of the file name
          let pillDisplayName = file.fileName;
          if (file.selectedSummaryId && file.summaries) {
            const summaryObj = file.summaries.find(
              (s) => s.id === file.selectedSummaryId
            );
            if (summaryObj) {
              pillDisplayName = summaryObj.name;
            }
          }

          pill.innerHTML = `
            <span class="file-name">${DOMPurify.sanitize(
              pillDisplayName
            )}</span>
            <span class="file-classification">${DOMPurify.sanitize(
              file.classification
            )}</span>
          `;

          // Show doc info modal on click
          pill.addEventListener("click", () => {
            FileUploadEventsModule.showDocumentInfoModal(file);
          });

          filesContainer.appendChild(pill);
        });

        userMessageContainer.appendChild(filesContainer);
      }

      // Add the user message text
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("user-message-content");
      contentDiv.innerText = message.content;

      userMessageContainer.appendChild(contentDiv);

      // For user messages that include an ignoredFilesSummary
      if (message.ignoredFilesSummary) {
        console.log(
          "[DEBUG][rendering] Rendering ignoredFilesSummary:",
          message.ignoredFilesSummary
        );
        const ignoredInfoElem = document.createElement("div");
        ignoredInfoElem.classList.add("ignored-files-summary");
        ignoredInfoElem.innerText = message.ignoredFilesSummary;
        userMessageContainer.appendChild(ignoredInfoElem);
      }

      messageElem.appendChild(userMessageContainer);
    }

    return messageElem;
  }

  // 5) Simple full re-render of conversation (could be optimized)
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

  // 6) Render list of chats
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

      // Delete button (ensure event handler is somewhere else or delegated)
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
