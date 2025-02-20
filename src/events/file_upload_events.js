/**
 * File Upload Events Module
 * Handles user actions for attaching files.
 */
const FileUploadEventsModule = (function () {
  // Allowed file extensions
  const ALLOWED_EXTENSIONS = ["pdf", "txt", "md", "docx"];

  // Global array to store pending files and their classifications
  let pendingFiles = [];

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
    showClassificationModal(file, function () {
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
      .map((c, index) => {
        return `
          <label class="radio">
            <input type="radio" name="info-class" value="${c}" ${
          index === 0 ? "checked" : ""
        } />
            ${c}
          </label>
        `;
      })
      .join("<br/>");

    // Build the modal content
    const modalContent = `
      <p>Choose an Information Class for <strong>${DOMPurify.sanitize(
        file.name
      )}</strong>:</p>
      <div style="margin: 1rem 0;">
        ${classificationRadios}
      </div>
    `;

    // Modal buttons
    const buttons = [
      { label: TranslationModule.translate("cancel"), value: false },
      {
        label: TranslationModule.translate("confirm"),
        value: true,
        class: "is-primary",
      },
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

        // Create a pending file object with a unique ID and additional metadata
        const pendingFile = {
          id: Date.now().toString(),  // simple unique ID
          file: file,
          classification: chosenClass,
          fileName: file.name,
          extension: file.name.split('.').pop().toLowerCase()
        };
        pendingFiles.push(pendingFile);
        renderPendingFiles(pendingFiles);
        console.log("Pending Files:", pendingFiles);
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

  function renderPendingFiles(files) {
    const container = document.getElementById("pending-uploads-container");
    if (!container) return;
    container.innerHTML = ""; // Clear existing chips

    files.forEach(item => {
      const chip = document.createElement("div");
      chip.classList.add("file-chip");
      chip.dataset.fileId = item.id;
      chip.innerHTML = `
        <span class="file-chip-name">${DOMPurify.sanitize(item.fileName)}</span>
        <span class="file-chip-classification">${item.classification}</span>
        <button class="file-chip-remove">×</button>
      `;
      chip.querySelector(".file-chip-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        removePendingFile(item.id);
      });
      container.appendChild(chip);
    });
  }

  function removePendingFile(fileId) {
    pendingFiles = pendingFiles.filter(file => file.id !== fileId);
    renderPendingFiles(pendingFiles);
  }

  // Public API
  return {
    setupEventListeners,
  };
})();
