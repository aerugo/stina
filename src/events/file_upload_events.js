/**
 * File Upload Events Module
 * Handles user actions for attaching files.
 */
const FileUploadEventsModule = (function () {
  // Allowed file extensions
  const ALLOWED_EXTENSIONS = ["pdf", "txt", "md", "docx"];

  // Global array to store pending files and their classifications
  let pendingFiles = [];

  function getPendingFiles() {
    return pendingFiles;
  }

  function clearPendingFiles() {
    pendingFiles = [];
    renderPendingFiles(pendingFiles);
  }
  
  function getAndClearPendingFiles() {
    const files = [...pendingFiles];
    clearPendingFiles();
    return files;
  }

  // File parsing functions
  async function parseTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  async function parsePDFFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Set the PDF.js worker URL if not already set
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.mjs';
      }

      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      // Extract text content from all pages concurrently
      const pagePromises = [];
      for (let i = 1; i <= totalPages; i++) {
        pagePromises.push(
          pdf.getPage(i).then(page =>
            page.getTextContent().then(textContent =>
              textContent.items.map(s => s.str).join('')
            )
          )
        );
      }
      const pageTexts = await Promise.all(pagePromises);

      return pageTexts.join('\n');
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw error;
    }
  }

  async function parseDocxFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw error;
    }
  }

  async function parseFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      switch (ext) {
        case 'txt':
        case 'md':
          return await parseTextFile(file);
        case 'pdf':
          return await parsePDFFile(file);
        case 'docx':
          return await parseDocxFile(file);
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      console.error('File parsing error:', error);
      throw error;
    }
  }

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

  async function processFiles(files, index) {
    if (index >= files.length) return; // all files processed

    const file = files[index];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      const unsupportedText = TranslationModule.translate("unsupportedFileType").replace("{ext}", ext);
      const allowedText = TranslationModule.translate("allowedFileTypes");
      ModalModule.showCustomAlert(`${unsupportedText} ${allowedText}`);
      // Continue with next file even if this one is not allowed
      processFiles(files, index + 1);
      return;
    }

    try {
      // Show processing modal before starting PDF parsing
      showProcessingModal();
      const content = await parseFile(file);
      // Hide processing modal on success
      hideProcessingModal();
      
      // Save the parsed content with the file for token calculations
      file.parsedContent = content;
      
      // Show the combined preview and classification modal
      showPreviewAndClassificationModal(file, content, files, index, function(success, chosenClass) {
        if (success) {
          // Tokenize parsed file content
          const tokenCount = TokenizationModule.countTokens(content);

          // Create a pending file object with a unique ID and additional metadata
          const pendingFile = {
            id: Date.now().toString(),  // simple unique ID
            file: file,
            classification: chosenClass,
            fileName: file.name,
            extension: file.name.split('.').pop().toLowerCase(),
            content: content,
            tokenCount: tokenCount,
            ignored: false,    // initialize ignored state to false
            summaries: [],     // array to store document summaries
            selectedSummaryId: null  // currently active summary (if any)
          };
          pendingFiles.push(pendingFile);
          renderPendingFiles(pendingFiles);
          console.log("Pending Files:", pendingFiles);
        }
        processFiles(files, index + 1);
      });
    } catch (error) {
      // Hide processing modal on error
      hideProcessingModal();
      const errorMsg = TranslationModule.translate("errorParsingFile")
        .replace("{fileName}", file.name)
        .replace("{errorMessage}", error.message);
      ModalModule.showCustomAlert(errorMsg);
      processFiles(files, index + 1);
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
      
      // Apply appropriate classes
      if (item.ignored) {
        chip.classList.add("ignored-file");
      }
      if (item.selectedSummaryId) {
        chip.classList.add("summary-active");
      }
      
      // Determine display name - if summary is active, show summary title instead of the file name
      let pillDisplayName = item.fileName;
      if (item.selectedSummaryId) {
        const summaryObj = item.summaries.find(s => s.id === item.selectedSummaryId);
        if (summaryObj) {
          pillDisplayName = summaryObj.name;
        }
      }
      
      chip.innerHTML = `
        <span class="file-chip-name">${DOMPurify.sanitize(pillDisplayName)}</span>
        <span class="file-chip-classification">${item.classification}</span>
        <button class="file-chip-remove">×</button>
      `;
      
      // Remove button event
      chip.querySelector(".file-chip-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        removePendingFile(item.id);
      });
      
      // Add click event to show document info modal
      chip.addEventListener("click", () => {
        showDocumentInfoModal(item);
      });
      
      container.appendChild(chip);
    });
  }
  
  function showDocumentInfoModal(file) {
    // Ensure file has required properties
    if (!file.summaries) file.summaries = [];
    if (file.selectedSummaryId === undefined) file.selectedSummaryId = null;
    
    // Build summaries section HTML
    let summariesHTML = '';
    if (file.summaries && file.summaries.length > 0) {
      summariesHTML = `
        <div class="field">
          <label class="label">Available Summaries:</label>
          <div id="existing-summaries-list">
            <div class="summary-item">
              <label class="radio">
                <input type="radio" name="document-summary" value="" ${!file.selectedSummaryId ? "checked" : ""}>
                <span>No Summary (Use full document)</span>
              </label>
            </div>
            ${file.summaries.map(summary => `
              <div class="summary-item">
                <label class="radio">
                  <input type="radio" name="document-summary" value="${summary.id}" 
                    ${file.selectedSummaryId === summary.id ? "checked" : ""}>
                  <span class="summary-name">${DOMPurify.sanitize(summary.name)}</span>
                </label>
                <button class="button is-small view-summary-btn" data-summary-id="${summary.id}">View</button>
              </div>
            `).join('')}
          </div>
        </div>`;
    } else {
      summariesHTML = `
        <div class="field">
          <label class="label">Summaries:</label>
          <p>No summaries available.</p>
        </div>`;
    }
    
    ModalModule.showCustomModal(
      TranslationModule.translate("documentInfoTitle") || "Document Info",
      `<p><strong>${TranslationModule.translate("fileName") || "File"}:</strong> ${DOMPurify.sanitize(file.fileName)}</p>
       <p><strong>${TranslationModule.translate("classification") || "Classification"}:</strong> ${file.classification}</p>
       <p><strong>${TranslationModule.translate("tokenCount") || "Token Count"}:</strong> ${file.tokenCount}</p>
       <hr>
       <div class="file-content-preview">${DOMPurify.sanitize(file.content)}</div>
       <hr>
       ${summariesHTML}
       <div class="field">
         <button id="generate-summary-btn" class="button is-primary">Generate New Summary</button>
       </div>
       <hr>
       <label class="checkbox" style="margin-top: 1em;">
         <input type="checkbox" id="ignore-file-checkbox" ${file.ignored ? "checked" : ""} />
         <span style="margin-left: 0.5rem;">Ignore This Document</span>
       </label>`,
      [{ label: TranslationModule.translate("ok") || "OK", value: true }],
      () => {
        // Handle ignore checkbox
        const ignoreCheckbox = document.getElementById("ignore-file-checkbox");
        if (ignoreCheckbox) {
          file.ignored = ignoreCheckbox.checked;
          console.log("[DEBUG][file_upload] File", file.fileName, "ignored state set to:", file.ignored);
        }
        
        // Handle summary selection
        const selectedSummaryRadio = document.querySelector('input[name="document-summary"]:checked');
        if (selectedSummaryRadio) {
          file.selectedSummaryId = selectedSummaryRadio.value || null;
          console.log("[DEBUG][file_upload] Selected summary:", file.selectedSummaryId);
        } else {
          file.selectedSummaryId = null;
        }
        
        // If this is a file in a chat message, update the chat
        if (!pendingFiles.some(pf => pf.id === file.id)) {
          // This is likely a file from a chat message
          ChatModule.saveChats();
          RenderingModule.renderConversation(ChatModule.getCurrentChat().conversation);
        } else {
          // This is a pending file
          renderPendingFiles(pendingFiles);
        }
      }
    );
    
    // Add event listener for the generate summary button
    setTimeout(() => {
      const generateSummaryBtn = document.getElementById("generate-summary-btn");
      if (generateSummaryBtn) {
        generateSummaryBtn.addEventListener("click", () => {
          SummariesEventsModule.showSummarizationModal(file, (newSummary) => {
            file.summaries.push(newSummary);
            file.selectedSummaryId = newSummary.id;
            showDocumentInfoModal(file); // Re-open the modal with updated summaries
          });
        });
      }
      
      // Add event listeners for view summary buttons
      const viewSummaryBtns = document.querySelectorAll('.view-summary-btn');
      viewSummaryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const summaryId = btn.dataset.summaryId;
          const summary = file.summaries.find(s => s.id === summaryId);
          if (summary) {
            ModalModule.showCustomModal(
              "Summary: " + summary.name,
              `<div class="summary-content">
                <p><strong>Instructions:</strong> ${DOMPurify.sanitize(summary.instructions)}</p>
                <hr>
                <p>${DOMPurify.sanitize(summary.content)}</p>
              </div>`,
              [{ label: TranslationModule.translate("ok") || "OK", value: true }]
            );
          }
        });
      });
    }, 0);
  }

  function removePendingFile(fileId) {
    pendingFiles = pendingFiles.filter(file => file.id !== fileId);
    renderPendingFiles(pendingFiles);
  }

  function showProcessingModal() {
    ModalModule.showCustomModal(
      TranslationModule.translate("processingDocumentTitle"),
      `<p>${TranslationModule.translate("processingDocumentMessage")}</p>`,
      // No buttons so the user can't cancel early
      [],
      () => { /* no-op callback */ }
    );
  }

  function hideProcessingModal() {
    const modal = document.getElementById("custom-modal");
    if (modal) {
      modal.classList.remove("is-active");
    }
  }

  /**
   * Shows a combined preview and classification modal
   */
  function showPreviewAndClassificationModal(file, content, files, currentIndex, onComplete) {
    // Calculate token counts
    const documentTokens = TokenizationModule.countTokens(content);
    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();
    const selectedModelKey = currentChat.selectedModelKey || config.selectedModelKey || "gpt-4o";
    const selectedModel = ModelsModule.getModel(selectedModelKey);
    const modelTokenLimit = selectedModel.context_length || 0;
    const historyTokens = (currentChat.conversation || []).reduce((sum, msg) => {
      let msgTokens = TokenizationModule.countTokens(msg.content);
      if (msg.attachedFiles && Array.isArray(msg.attachedFiles)) {
        msgTokens += msg.attachedFiles.reduce((fileSum, file) => {
          return fileSum + (!file.ignored ? (file.tokenCount || TokenizationModule.countTokens(file.content)) : 0);
        }, 0);
      }
      return sum + msgTokens;
    }, 0);
    
    // Calculate tokens from other pending documents
    let pendingTokens = 0;
    for (let i = 0; i < currentIndex; i++) {
      if (files[i].parsedContent) {
        pendingTokens += TokenizationModule.countTokens(files[i].parsedContent);
      }
    }
    // Add tokens from already pending files
    pendingFiles.forEach(file => {
      pendingTokens += file.tokenCount || 0;
    });

    // Classification options (localized)
    const classificationOptions = [
      TranslationModule.translate("classificationOption1"),
      TranslationModule.translate("classificationOption2"),
      TranslationModule.translate("classificationOption3"),
      TranslationModule.translate("classificationOption4"),
      TranslationModule.translate("classificationOption5")
    ];

    // Build modal content that combines preview info and classification options
    let modalContent = `
      <div class="modal-preview-container">
        <div class="preview-header">
          <h3>${TranslationModule.translate("previewFileName")}: ${DOMPurify.sanitize(file.name)}</h3>
        </div>
        <div class="preview-body">
          <div class="preview-detail">
            <strong>${TranslationModule.translate("previewContent")}:</strong>
            <a id="toggle-preview-btn" class="toggle-preview is-size-7 has-text-link" style="cursor: pointer;">
              ${TranslationModule.translate("showPreview")}
            </a>
            <div id="content-preview" class="preview-text is-hidden">
              ${DOMPurify.sanitize(content.slice(0, 300))}${content.length > 300 ? "..." : ""}
            </div>
          </div>
          <div class="preview-details-pills">
            <span class="pill"><strong>${TranslationModule.translate("previewDocumentTokens")}</strong>: ${documentTokens}</span>
            <span class="pill"><strong>${TranslationModule.translate("previewModelTokenLimit")}</strong>: ${modelTokenLimit}</span>
            <span class="pill"><strong>${TranslationModule.translate("previewHistoryTokens")}</strong>: ${historyTokens}</span>
            <span class="pill"><strong>${TranslationModule.translate("previewPendingTokens")}</strong>: ${pendingTokens}</span>
          </div>
        </div>
        <hr>
        <div class="classification-section">
          <h3>${TranslationModule.translate("classificationModalTitle")}</h3>
          <form id="classification-form">
            ${classificationOptions.map((option, index) => `
              <label class="radio option-label">
                <input type="radio" name="classification" value="${option}" ${index === 0 ? "checked" : ""}>
                <span>${option}</span>
              </label>
            `).join('')}
          </form>
        </div>
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

    // Open the combined modal
    ModalModule.showCustomModal(
      TranslationModule.translate("previewModalTitle"),
      modalContent,
      buttons,
      function(confirmed) {
        if (!confirmed) {
          onComplete(false);
          return;
        }

        const chosenClass = getSelectedClassification();
        if (!chosenClass) {
          ModalModule.showCustomAlert(TranslationModule.translate("pleaseSelectClassification"));
          onComplete(false);
          return;
        }

        onComplete(true, chosenClass);
      }
    );
    
    // Attach toggle functionality for the content preview in the combined modal
    setTimeout(() => {
      const toggleBtn = document.getElementById("toggle-preview-btn");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", function() {
          const previewElem = document.getElementById("content-preview");
          previewElem.classList.toggle("is-hidden");
          if (previewElem.classList.contains("is-hidden")) {
            toggleBtn.textContent = TranslationModule.translate("showPreview");
          } else {
            toggleBtn.textContent = TranslationModule.translate("hidePreview");
          }
        });
      }
    }, 0);

    function getSelectedClassification() {
      const radios = document.querySelectorAll('input[name="classification"]');
      for (const r of radios) {
        if (r.checked) return r.value;
      }
      return null;
    }
  }

  /**
   * Shows a preview modal with file details and token information
   */
  function showFilePreviewModal(file, content, files, currentIndex, onConfirm) {
    // Calculate the document token count
    const documentTokens = TokenizationModule.countTokens(content);

    // Get current chat and selected model info
    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();
    const selectedModelKey = currentChat.selectedModelKey || config.selectedModelKey || "gpt-4o";
    const selectedModel = ModelsModule.getModel(selectedModelKey);
    const modelTokenLimit = selectedModel.tokenLimit || selectedModel.maxTokens || 0;

    // Calculate tokens used in the current conversation (i.e. history)
    const historyTokens = (currentChat.conversation || []).reduce((sum, msg) => {
      return sum + TokenizationModule.countTokens(msg.content);
    }, 0);

    // Calculate tokens from other pending documents
    let pendingTokens = 0;
    for (let i = 0; i < currentIndex; i++) {
      if (files[i].parsedContent) {
        pendingTokens += TokenizationModule.countTokens(files[i].parsedContent);
      }
    }
    // Add tokens from already pending files
    pendingFiles.forEach(file => {
      pendingTokens += file.tokenCount || 0;
    });

    // Create the modal content with localized labels
    const modalContent = `
      <p><strong>${TranslationModule.translate("previewFileName")}: </strong>${DOMPurify.sanitize(file.name)}</p>
      <p><strong>${TranslationModule.translate("previewContent")}: </strong>${DOMPurify.sanitize(content.slice(0, 300))}${content.length > 300 ? "..." : ""}</p>
      <p><strong>${TranslationModule.translate("previewDocumentTokens")}: </strong>${documentTokens}</p>
      <p><strong>${TranslationModule.translate("previewModelTokenLimit")}: </strong>${modelTokenLimit}</p>
      <p><strong>${TranslationModule.translate("previewHistoryTokens")}: </strong>${historyTokens}</p>
      <p><strong>${TranslationModule.translate("previewPendingTokens")}: </strong>${pendingTokens}</p>
    `;

    // Show the preview modal; when confirmed, call onConfirm
    ModalModule.showCustomModal(
      TranslationModule.translate("previewModalTitle"),
      modalContent,
      [
        {
          label: TranslationModule.translate("confirm"),
          value: true,
          class: "is-primary"
        }
      ],
      function(result) {
        if (result) {
          onConfirm();
        }
      }
    );
  }

  // Public API
  return {
    setupEventListeners,
    getPendingFiles,
    clearPendingFiles,
    getAndClearPendingFiles,
    showDocumentInfoModal,
  };
})();
