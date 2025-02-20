/**
 * File Upload Events Module
 * Handles user actions for attaching files.
 */
const FileUploadEventsModule = (function () {
  // Allowed file extensions
  const ALLOWED_EXTENSIONS = ["pdf", "txt", "md", "docx"];

  // Global array to store attached files and their classifications
  const attachedFiles = [];

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
    input.multiple = true; // Allow selecting multiple files
    input.accept = ".pdf, .txt, .md, .docx"; // restrict selection
    input.addEventListener("change", handleFileSelection);
    input.click();
  }

  /**
   * Triggered after the user picks a file.
   */
  function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    processFiles(files, 0);
  }

  function processFiles(files, index) {
    if (index >= files.length) return; // all files processed

    const file = files[index];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      ModalModule.showCustomAlert(
        `Unsupported file type: .${ext}. Allowed: pdf, txt, md, docx.`
      );
      // Continue with next file even if this one is not allowed
      processFiles(files, index + 1);
      return;
    }
    // Process current file then move on to the next one
    showClassificationModal(file, function() {
      processFiles(files, index + 1);
    });
  }

  /**
   * Shows a modal with radio buttons for classification (C1..C5).
   * On Confirm, logs the File object and classification to the console.
   */
  function showClassificationModal(file, onComplete) {
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
      { label: TranslationModule.translate("confirm"), value: true, class: "is-primary" },
    ];

    // Show the modal and process the response via onComplete callback
    ModalModule.showCustomModal(
      TranslationModule.translate("selectClassification"),
      modalContent,
      buttons,
      function (confirmed) {
        if (!confirmed) {
          onComplete(false);
          return;
        }

        const chosenClass = getSelectedClassification();
        if (!chosenClass) {
          ModalModule.showCustomAlert("Please select a classification.");
          onComplete(false);
          return;
        }

        // Add the file and its classification to the attachedFiles array
        attachedFiles.push({ file: file, classification: chosenClass });
        console.log("Current Attached Files:", attachedFiles);
        onComplete(true);
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
