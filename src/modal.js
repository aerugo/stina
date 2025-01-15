/**
 * Modal Module
 * Handles custom modal dialogs
 */
var ModalModule = (function () {
  function showCustomModal(title, message, buttons, callback) {
    const modal = document.getElementById("custom-modal");
    modal.classList.add("is-active");

    const modalTitle = modal.querySelector(".modal-card-title");
    const modalBody = modal.querySelector(".modal-card-body");
    const modalFooter = modal.querySelector(".modal-card-foot");

    modalTitle.textContent = title;
    modalBody.innerHTML = message;

    modalFooter.innerHTML = "";
    buttons.forEach((button) => {
      const btn = document.createElement("button");
      btn.classList.add("button");
      if (button.class) btn.classList.add(button.class);
      if (button.value === true && !button.class)
        btn.classList.add("is-primary");
      btn.textContent = button.label;
      btn.addEventListener("click", () => {
        modal.classList.remove("is-active");
        if (callback) callback(button.value);
      });
      modalFooter.appendChild(btn);
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
    callback
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
                        value="${defaultLabel || ""}"
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
                    >${defaultContent || ""}</textarea>
                </div>
            </div>
        `;

    const buttons = [
      { label: TranslationModule.translate("cancel"), value: false },
      {
        label: TranslationModule.translate("save"),
        value: true,
        class: "is-success",
      },
    ];

    showCustomModal(
      TranslationModule.translate(titleKey),
      modalContent,
      buttons,
      function (result) {
        if (result) {
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
