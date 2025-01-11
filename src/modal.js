/**
 * Modal Module
 * Handles custom modal dialogs
 */
var ModalModule = (function () {
    function showCustomModal(title, message, buttons, callback) {
        const modal = document.getElementById("custom-modal");
        const titleElem = document.getElementById("custom-modal-title");
        const bodyElem = document.getElementById("custom-modal-body");
        const footerElem = document.getElementById("custom-modal-footer");

        titleElem.textContent = title;
        bodyElem.innerHTML = `<p>${message}</p>`;

        footerElem.innerHTML = "";
        buttons.forEach((button) => {
            const btn = document.createElement("button");
            btn.textContent = button.label;
            btn.addEventListener("click", () => {
                modal.style.display = "none";
                if (callback) callback(button.value);
            });
            footerElem.appendChild(btn);
        });

        modal.style.display = "block";

        const closeButton = document.getElementById("custom-modal-close");
        closeButton.onclick = () => {
            modal.style.display = "none";
            if (callback) callback(null);
        };
    }

    function showCustomAlert(message) {
        showCustomModal("Alert", message, [{ label: "OK", value: true }]);
    }

    function showCustomConfirm(message, callback) {
        const buttons = [
            { label: "Cancel", value: false },
            { label: "OK", value: true },
        ];
        showCustomModal("Confirm", message, buttons, callback);
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
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", () => {
            modal.style.display = "none";
            if (callback) callback(null);
        });

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
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

    return {
        showCustomModal,
        showCustomAlert,
        showCustomConfirm,
        showInputModal,
    };
})();
