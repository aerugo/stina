/**
 * File Upload Events Module
 * Handles user actions for attaching files.
 */
const FileUploadEventsModule = (function () {
  // Allowed file extensions
  const ALLOWED_EXTENSIONS = ["pdf", "txt", "md", "docx"];

  function setupEventListeners() {
    const attachBtn = document.getElementById("attach-file-btn");
    if (attachBtn) {
      attachBtn.addEventListener("click", openFilePicker);
    }
  }

  /**
   * Opens a file picker limited to .pdf, .txt, .md, .docx.
   */
  function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf, .txt, .md, .docx"; // restrict selection
    input.addEventListener("change", handleFileSelection);
    input.click();
  }

  /**
   * Triggered after the user picks a file.
   */
  function handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return; // user canceled

    // Quick file-extension check
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      ModalModule.showCustomAlert(
        `Unsupported file type: .${ext}. Allowed: pdf, txt, md, docx.`
      );
      return;
    }

    // Proceed to classification prompt
    showClassificationModal(file);
  }

  /**
   * Shows a modal with radio buttons for classification (C1..C5).
   * On Confirm, logs the File object and classification to the console.
   */
  function showClassificationModal(file) {
    const classificationOptions = ["C1", "C2", "C3", "C4", "C5"];

    // Create radio inputs
    const classificationRadios = classificationOptions
      .map((c) => {
        return `
          <label class="radio">
            <input type="radio" name="info-class" value="${c}" />
            ${c}
          </label>
        `;
      })
      .join("<br/>");

    // Build the modal content
    const modalContent = `
      <p>Choose an Information Class for <strong>${DOMPurify.sanitize(file.name)}</strong>:</p>
      <div style="margin: 1rem 0;">
        ${classificationRadios}
      </div>
    `;

    // Modal buttons
    const buttons = [
      { label: TranslationModule.translate("cancel"), value: false },
      {
        label: "Confirm",
        value: true,
        class: "is-primary",
      },
    ];

    // Show the modal
    ModalModule.showCustomModal(
      "Select Classification",
      modalContent,
      buttons,
      function (confirmed) {
        if (!confirmed) {
          // user canceled
          return;
        }

        // Check which classification was chosen
        const chosenClass = getSelectedClassification();
        if (!chosenClass) {
          ModalModule.showCustomAlert("Please select a classification.");
          return;
        }

        // For now, log the file object and chosen classification
        console.log("File object:", file);
        console.log("Chosen classification:", chosenClass);
      }
    );

    function getSelectedClassification() {
      const radios = document.querySelectorAll('input[name="info-class"]');
      for (const r of radios) {
        if (r.checked) return r.value;
      }
      return null;
    }
  }

  // Public API
  return {
    setupEventListeners,
  };
})();
