/**
 * CodeBlockComponent Module
 * Handles rendering and highlighting of code blocks.
 */
const CodeBlockComponent = (function () {
  function renderCodeBlock(code, infostring) {
    let language = (infostring || "").match(/\S*/)[0];

    // Ensure code is a string
    if (typeof code !== "string") {
      if (code && (code.raw || code.text)) {
        code = code.raw || code.text;
      } else {
        code = String(code);
      }
    }

    // If string code string starts with ```, get the first word after ``` if it is followed by a newline and store as lang
    if (code.startsWith("```")) {
      const l = code.match(/```(\w+)/);
      if (l) {
        code = code.replace(/```(\w+)/, "");
        // Remove the first line if it is empty
        code = code.replace(/^\s*\n/, "");
        // Remove trailing ``` if it exists
        code = code.replace(/\s*```$/, "");
        // Remove trailing newline if it exists
        code = code.replace(/\n$/, "");
        // Set the language
        language = l[1];
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
    let sanitizedHighlighted = DOMPurify.sanitize(highlighted);

    // Remove any leading or trailing triple backticks
    if (sanitizedHighlighted.startsWith("```")) {
      sanitizedHighlighted = sanitizedHighlighted.slice(3);
    }
    if (sanitizedHighlighted.endsWith("```")) {
      sanitizedHighlighted = sanitizedHighlighted.slice(0, -3);
    }

    // Generate a unique ID for each code block
    const codeBlockId = "code-block-" + Math.random().toString(36).substr(2, 9);

    // Return the custom HTML for the code block with a copy button
    // If language is not specified, set it to 'plaintext'
    const languageLabel = language || "plaintext";

    return `
      <div class="code-block-container">
        <div class="language-label">${languageLabel}</div>
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
  }

  function attachCopyEvent(container) {
    container.addEventListener("click", function (event) {
      const target = event.target;
      if (target.closest(".copy-code-button")) {
        const button = target.closest(".copy-code-button");
        const codeBlockId = button.getAttribute("data-code-block-id");
        const codeBlock = document.getElementById(codeBlockId);

        if (codeBlock) {
          const codeText = codeBlock.textContent;

          navigator.clipboard
            .writeText(codeText)
            .then(() => {
              showCopiedLabel(button);
            })
            .catch((err) => {
              console.error(TranslationModule.translate("copy_error"), err);
            });
        }
      }
    });
  }

  function showCopiedLabel(button) {
    const copiedLabel = document.createElement("div");
    copiedLabel.classList.add("copied-label");
    copiedLabel.textContent = TranslationModule.translate("copied");

    const container = button.closest(".code-block-container");
    container.appendChild(copiedLabel);

    const buttonRect = button.getBoundingClientRect();
    copiedLabel.style.left = `${button.offsetLeft + button.offsetWidth / 2}px`;

    setTimeout(() => {
      copiedLabel.remove();
    }, 2000);
  }

  return {
    renderCodeBlock,
    attachCopyEvent,
  };
})();
