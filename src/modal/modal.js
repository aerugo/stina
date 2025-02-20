/**
 * Modal Module
 * Handles custom modal dialogs
 */
const ModalModule = (function () {
  /**
   * Escapes HTML special characters in a string.
   * @param {string} string - The string to escape.
   * @returns {string} - The escaped string.
   */
  function escapeHtml(string) {
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function showCustomModal(title, message, buttons, callback) {
    const modal = document.getElementById("custom-modal");
    modal.classList.add("is-active");

    const modalTitle = modal.querySelector(".modal-card-title");
    const modalBody = modal.querySelector(".modal-card-body");
    const modalFooter = modal.querySelector(".modal-card-foot");

    modalTitle.textContent = title;
    
    // Handle message content safely
    if (typeof message === 'string' && !message.includes('<')) {
      // Simple text message
      modalBody.textContent = message;
    } else {
      // HTML content that needs sanitization
      modalBody.innerHTML = DOMPurify.sanitize(message);
    }

    modalFooter.innerHTML = "";
    buttons.forEach(function(btn) {
      const buttonElem = document.createElement("button");
      buttonElem.textContent = btn.label;
      buttonElem.classList.add("button");
      if (btn.class) {
        btn.class.split(" ").forEach((cls) => buttonElem.classList.add(cls));
      } else if (btn.value === true) {
        buttonElem.classList.add("is-primary");
      }
      buttonElem.addEventListener("click", function () {
        modal.classList.remove("is-active");
        if (callback) callback(btn.value);
      });
      modalFooter.appendChild(buttonElem);
    });

    const modalBackground = modal.querySelector(".modal-background");
    const closeButton = modal.querySelector(".delete");

    modalBackground.onclick = closeModal;
    closeButton.onclick = closeModal;

    function closeModal() {
      modal.classList.remove("is-active");
      if (callback) callback(null);
    }
  }

  function showCustomAlert(message) {
    showCustomModal(TranslationModule.translate("alertTitle"), message, [
      { label: TranslationModule.translate("ok"), value: true },
    ]);
  }

  function showCustomConfirm(message, callback) {
    const buttons = [
      { label: TranslationModule.translate("cancel"), value: false },
      { label: TranslationModule.translate("ok"), value: true },
    ];
    showCustomModal(
      TranslationModule.translate("confirmTitle"),
      message,
      buttons,
      callback
    );
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
    cancelButton.textContent = TranslationModule.translate("cancel");
    cancelButton.addEventListener("click", () => {
      modal.style.display = "none";
      if (callback) callback(null);
    });

    const okButton = document.createElement("button");
    okButton.textContent = TranslationModule.translate("ok");
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

  function showEditInstructionModal(
    titleKey,
    defaultLabel,
    defaultContent,
    callback,
    showDeleteButton = false
  ) {
    const modalContent = `
            <div class="field">
                <label class="label">${TranslationModule.translate(
                  "instructionTitleLabel"
                )}</label>
                <div class="control">
                    <input
                        class="input"
                        type="text"
                        id="modal-label-input"
                        placeholder="${TranslationModule.translate(
                          "enterInstructionTitle"
                        )}"
                        value="${escapeHtml(defaultLabel || "")}"
                    />
                </div>
            </div>
            <div class="field">
                <label class="label">${TranslationModule.translate(
                  "instructionContentLabel"
                )}</label>
                <div class="control">
                    <textarea
                        class="textarea"
                        id="modal-content-input"
                        placeholder="${TranslationModule.translate(
                          "enterInstructionContent"
                        )}"
                        rows="8"
                    >${escapeHtml(defaultContent || "")}</textarea>
                </div>
            </div>
        `;

    const buttons = [
      { label: TranslationModule.translate("cancel"), value: "cancel" },
      {
        label: TranslationModule.translate("save"),
        value: "save",
        class: "is-success",
      },
    ];

    if (showDeleteButton) {
      buttons.unshift({
        label: TranslationModule.translate("delete"),
        value: "delete",
        class: "is-danger",
      });
    }

    showCustomModal(
      TranslationModule.translate(titleKey),
      modalContent,
      buttons,
      function (result) {
        if (result === "save") {
          const inputLabel = document
            .getElementById("modal-label-input")
            .value.trim();
          const inputContent = document
            .getElementById("modal-content-input")
            .value.trim();
          if (inputLabel && inputContent) {
            callback({
              label: inputLabel,
              content: inputContent,
            });
          } else {
            showCustomAlert(
              TranslationModule.translate("pleaseFillRequiredFields")
            );
          }
        } else if (result === "delete") {
          callback({ action: "delete" });
        } else {
          callback(null);
        }
      }
    );
  }

  return {
    showCustomModal,
    showCustomAlert,
    showCustomConfirm,
    showInputModal,
    showEditInstructionModal,
  };
})();
