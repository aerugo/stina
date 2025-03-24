/**
 * DocumentsManagerEventsModule
 * Handles the "Manage Documents" button click and modal logic.
 */
const DocumentsManagerEventsModule = (function () {
  // Helper alias for translate
  const t = TranslationModule.translate;

  /**
   * Gathers:
   *  - All attached documents in the current chat conversation (not ignored)
   *  - All pending files in FileUploadEventsModule (not ignored)
   */
  function getAllDocuments() {
    const allDocs = [];

    // 1) Conversation docs
    const currentChat = ChatModule.getCurrentChat();
    if (currentChat && currentChat.conversation) {
      currentChat.conversation.forEach((message) => {
        if (message.role === "user" && Array.isArray(message.attachedFiles)) {
          message.attachedFiles.forEach((file) => {
            allDocs.push(file);
          });
        }
      });
    }

    // 2) Pending docs (from the upload area)
    const pending = FileUploadEventsModule.getPendingFiles();
    pending.forEach((file) => {
      if (!file.ignored) {
        allDocs.push(file);
      }
    });

    return allDocs;
  }

  /**
   * Shows or hides the documents button (#documents-btn)
   * depending on whether there are any available documents.
   */
  function updateDocumentsButtonVisibility() {
    const docs = getAllDocuments();
    const btn = document.getElementById("documents-btn");
    if (!btn) return;

    if (docs.length > 0) {
      btn.style.display = "inline-block";
    } else {
      btn.style.display = "none";
    }
  }

  /**
   * Opens a custom modal listing all documents and their summaries.
   * Allows the user to:
   *  - Toggle full-document vs. specific summaries
   *  - Generate new summaries for one or more docs (in parallel).
   *  - View existing summaries in a read-only modal.
   */
  function showDocumentsModal() {
    const docs = getAllDocuments();

    // Build the modal content
    let modalContent = `<div class="documents-manager-container">`;

    modalContent += `<p><strong>${t("documentsInThisChat")}</strong></p>`;
    if (docs.length === 0) {
      modalContent += `<p>${t("noDocumentsAvailable")}</p>`;
      modalContent += `</div>`;
      ModalModule.showCustomModal(t("manageDocumentsTitle"), modalContent, [
        { label: t("ok"), value: true }, // <-- renamed from "cancel" to "ok"
      ]);
      return;
    }

    modalContent += `<div class="documents-list">`;
    docs.forEach((doc, idx) => {
      const docId = doc.id || "doc_" + idx;
      const docName = DOMPurify.sanitize(doc.fileName || "Untitled Document");
      const checkedFull = doc.useFullDocument ? "checked" : "";
      const isPending = FileUploadEventsModule.getPendingFiles().includes(doc)
        ? `<span style="color: orange;">${t("pendingIndicator")}</span>`
        : "";

      const docClassification = doc.classificationLevel
        ? `<p><strong>${t("classification")}:</strong> ${
            doc.classificationLevel
          }</p>`
        : "";
      const docTokenCount = doc.tokenCount
        ? `<p><strong>${t("tokenCount")}:</strong> ${doc.tokenCount}</p>`
        : "";

      // Summaries checkboxes + "View" button
      let summariesHtml = "";
      if (doc.summaries && doc.summaries.length > 0) {
        summariesHtml = doc.summaries
          .map((summary) => {
            const isChecked =
              doc.selectedSummaryIds &&
              doc.selectedSummaryIds.includes(summary.id)
                ? "checked"
                : "";
            const summaryName = DOMPurify.sanitize(summary.name || "Unnamed");

            return `
            <label class="checkbox" style="display: flex; align-items: center; margin-bottom: 0.25rem;">
              <input type="checkbox" class="doc-summary-cb"
                     data-doc-id="${docId}" data-summary-id="${summary.id}"
                     ${isChecked}/>
              <span style="margin-left: 0.5rem;">${summaryName}</span>
              <!-- "View Summary" button -->
              <button type="button"
                      class="button is-small doc-view-summary-btn"
                      style="margin-left: auto;"
                      data-doc-id="${docId}"
                      data-summary-id="${summary.id}">
                ${t("viewSummary")}
              </button>
            </label>
          `;
          })
          .join("");
      } else {
        summariesHtml = `<em>${t("noExistingSummaries")}</em>`;
      }

      modalContent += `
      <div class="document-item" style="margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 1rem;">
        <p><strong>${docName}</strong> ${isPending}</p>
        ${docClassification}
        ${docTokenCount}
        <label class="checkbox">
          <input type="checkbox" class="doc-full-cb" data-doc-id="${docId}" ${checkedFull}/>
          <span>${t("useFullDocument")}</span>
        </label>
        <br>
        <p style="margin-top: 0.5rem;"><strong>${t(
          "availableSummaries"
        )}</strong></p>
        ${summariesHtml}
        <hr>
        <label class="checkbox">
          <input type="checkbox" class="doc-select-cb" data-doc-id="${docId}"/>
          <span>${t("selectForNewSummary")}</span>
        </label>
      </div>
    `;
    });
    modalContent += `</div>`; // end documents-list

    // Summaries generation options
    modalContent += `
    <div class="field" style="margin-top:1rem;">
      <label class="label">${t("summaryInstructions")}</label>
      <div class="control">
        <textarea id="multi-doc-summary-instructions" class="textarea" rows="3"
          placeholder="${t(
            "summarizingSelectedDocumentsPlaceholder"
          )}"></textarea>
      </div>
    </div>
    <div class="field">
      <label class="label">${t("chooseAModel")}</label>
      <div class="control">
        <div class="select">
          <select id="multi-doc-summary-model-select"></select>
        </div>
      </div>
    </div>
    <!-- Moved the "Generate Summaries" button inside the modal, near the summary input -->
    <div class="field" style="margin-top:1rem;">
      <button 
        id="multi-doc-generate-btn" 
        class="button is-primary"
        style="margin-right: 1rem;"
      >
        ${t("generateSummaries")}
      </button>
    </div>
    `;

    modalContent += `</div>`; // close .documents-manager-container

    // Show the modal with only an "Ok" button in the footer
    ModalModule.showCustomModal(
      t("manageDocumentsTitle"),
      modalContent,
      [
        {
          // Rename "cancel" to "ok":
          label: t("ok"),
          value: "ok",
        },
      ],
      function (action) {
        // If the user clicks "Ok", we simply close the modal.
        // The actual summary generation is now triggered by the
        // "Generate Summaries" button we added inside the modal content.
      }
    );

    // Populate model dropdown
    setTimeout(
      () => populateModelDropdown("multi-doc-summary-model-select"),
      0
    );

    // Attach event listeners for doc checkboxes & summary "View" buttons
    setTimeout(() => {
      const fullCheckboxes = document.querySelectorAll(".doc-full-cb");
      fullCheckboxes.forEach((cb) => {
        cb.addEventListener("change", (ev) => {
          const docId = ev.target.getAttribute("data-doc-id");
          toggleUseFullDocument(docId, ev.target.checked, docs);
        });
      });

      const summaryCheckboxes = document.querySelectorAll(".doc-summary-cb");
      summaryCheckboxes.forEach((cb) => {
        cb.addEventListener("change", (ev) => {
          const docId = ev.target.getAttribute("data-doc-id");
          const summaryId = ev.target.getAttribute("data-summary-id");
          toggleDocSummary(docId, summaryId, ev.target.checked, docs);
        });
      });

      const viewBtns = document.querySelectorAll(".doc-view-summary-btn");
      viewBtns.forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          const docId = ev.target.getAttribute("data-doc-id");
          const summaryId = ev.target.getAttribute("data-summary-id");
          viewDocumentSummary(docId, summaryId, docs);
        });
      });

      // NEW: Hook up the "Generate Summaries" button we placed inside the modal
      const generateBtn = document.getElementById("multi-doc-generate-btn");
      if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
          await handleGenerateSummaries(docs);
        });
      }
    }, 0);
  }

  /**
   * Populates a <select> element with models that can be used for summary generation.
   */
  function populateModelDropdown(selectId) {
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;

    // Use your existing logic (like ModelSelectionEventsModule) or a simplified approach:
    const allModels = ModelsModule.getModels();
    selectEl.innerHTML = "";
    for (const [key, model] of Object.entries(allModels)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = model.label || key;
      selectEl.appendChild(opt);
    }
    // Optionally select a default
    selectEl.value = ConfigModule.getConfig().selectedModelKey || "gpt-4o";
  }

  /**
   * Sets doc.useFullDocument = checked; also unchecks summary usage if set to full doc
   */
  function toggleUseFullDocument(docId, checked, docs) {
    const doc = docs.find((d) => (d.id || "doc_" + docs.indexOf(d)) === docId);
    if (!doc) return;
    doc.useFullDocument = checked;

    // If user checks "Use Full Document", clear doc.selectedSummaryIds
    if (checked) {
      doc.selectedSummaryIds = [];
    }
  }

  /**
   * Adds or removes a summary from doc.selectedSummaryIds
   * Also toggles doc.useFullDocument = false if a summary is selected.
   */
  function toggleDocSummary(docId, summaryId, isChecked, docs) {
    const doc = docs.find((d) => (d.id || "doc_" + docs.indexOf(d)) === docId);
    if (!doc) return;
    if (!doc.selectedSummaryIds) doc.selectedSummaryIds = [];

    if (isChecked) {
      // Turn off useFullDocument if a summary is checked
      doc.useFullDocument = false;
      const fullCb = document.querySelector(
        `.doc-full-cb[data-doc-id="${docId}"]`
      );
      if (fullCb) fullCb.checked = false;

      if (!doc.selectedSummaryIds.includes(summaryId)) {
        doc.selectedSummaryIds.push(summaryId);
      }
    } else {
      doc.selectedSummaryIds = doc.selectedSummaryIds.filter(
        (id) => id !== summaryId
      );
    }
  }

  /**
   * Opens a modal to view a particular summary's content in a read-only fashion.
   */
  function viewDocumentSummary(docId, summaryId, docs) {
    const doc = docs.find((d) => (d.id || "doc_" + docs.indexOf(d)) === docId);
    if (!doc) return;

    const summary = doc.summaries?.find((s) => s.id === summaryId);
    if (!summary) return;

    const safeSummaryContent = DOMPurify.sanitize(summary.content);
    const safeSummaryName = DOMPurify.sanitize(summary.name);

    const modalTitle = t("availableSummaries");
    const modalBodyHtml = `
    <div class="summary-view-modal-content">
      <p><strong>${safeSummaryName}</strong></p>
      <div style="white-space: pre-wrap; margin-top: 0.75rem;">
        ${safeSummaryContent}
      </div>
    </div>
  `;

    ModalModule.showCustomModal(
      modalTitle,
      modalBodyHtml,
      [
        {
          label: t("ok"),
          value: "back",
        },
      ],
      function (action) {
        if (action === "back") {
          // Re-render the Documents Manager content inside the same modal
          showDocumentsModal();
        }
      },
      { preventCloseOnBackdrop: true, hideCloseButton: true }
    );
  }

  /**
   * Called when user clicks "Generate Summaries" in the modal.
   * Uses a simple loading indicator rather than a "fake" progress bar.
   */
  async function handleGenerateSummaries(docs) {
    // Utility function for sub-modal with "Back" if needed
    const showBackModal = (title, bodyMessage) => {
      const safeBody = DOMPurify.sanitize(bodyMessage);
      ModalModule.showCustomModal(
        title || t("alertTitle"),
        safeBody,
        [{ label: t("ok"), value: "back" }],
        function (action) {
          if (action === "back") {
            showDocumentsModal();
          }
        },
        { preventCloseOnBackdrop: true, hideCloseButton: true }
      );
    };

    const instructions =
      document.getElementById("multi-doc-summary-instructions")?.value || "";
    const modelSelect = document.getElementById(
      "multi-doc-summary-model-select"
    );
    const selectedModelKey = modelSelect?.value || "gpt-4o";

    // 1) Collect docs that are selected
    const checkboxes = document.querySelectorAll(".doc-select-cb:checked");
    if (checkboxes.length === 0) {
      showBackModal(null, t("noDocsSelectedForSummaryGen"));
      return;
    }

    const docsToSummarize = [];
    checkboxes.forEach((cb) => {
      const docId = cb.getAttribute("data-doc-id");
      const docObj = docs.find(
        (d) => (d.id || "doc_" + docs.indexOf(d)) === docId
      );
      if (docObj) {
        docsToSummarize.push(docObj);
      }
    });

    if (docsToSummarize.length === 0) {
      showBackModal(null, t("noMatchingDocsFound"));
      return;
    }

    // 2) Show a "Generating Summaries..." message with a spinner (or any loading indicator).
    const modalBody = document.getElementById("custom-modal-body");
    modalBody.innerHTML = `
    <div style="text-align: center;">
      <p>${t("generatingSummariesForDocs").replace(
        "{count}",
        docsToSummarize.length
      )}</p>
      <!-- Example: a simple loading spinner. 
           You could also use a Bulma loader, or your own custom CSS spinner. -->
      <div class="loading-spinner" style="margin-top: 1rem;"></div>
    </div>
  `;

    // Summaries call in parallel
    const promises = docsToSummarize.map((doc) =>
      SummariesModule.generateSummary({
        docText: doc.content,
        instructions,
        selectedModelKey,
      })
        .then(({ summaryText, summaryName }) => {
          // Create summary object
          if (!doc.summaries) doc.summaries = [];
          const newSummary = {
            id:
              "summ_" +
              Date.now() +
              "_" +
              Math.random().toString(36).substr(2, 5),
            name: summaryName,
            content: summaryText,
            instructions,
            modelKey: selectedModelKey,
          };
          doc.summaries.push(newSummary);

          // Disable 'useFullDocument' and uncheck the UI box
          doc.useFullDocument = false;
          if (!doc.selectedSummaryIds) doc.selectedSummaryIds = [];
          doc.selectedSummaryIds.push(newSummary.id);

          const docId = doc.id || "doc_" + docs.indexOf(doc);
          const fullCb = document.querySelector(
            `.doc-full-cb[data-doc-id="${docId}"]`
          );
          if (fullCb) {
            fullCb.checked = false;
          }
        })
        .catch((err) => {
          console.error(t("failedToGenerateSummaryForDoc"), doc.fileName, err);
          // Show an error sub-modal but do *not* block other docs from generating
          ModalModule.showCustomModal(
            t("errorGeneratingSummaryForDoc").replace(
              "{fileName}",
              doc.fileName
            ),
            DOMPurify.sanitize(err.message),
            [{ label: t("ok"), value: "back" }],
            function (action) {
              if (action === "back") {
                showDocumentsModal();
              }
            },
            { preventCloseOnBackdrop: true, hideCloseButton: true }
          );
        })
    );

    // Wait for all summaries to finish
    await Promise.all(promises);

    // Once all documents are summarized, save them
    ChatModule.saveChats();

    // Show final success sub-modal with "OK → back"
    ModalModule.showCustomModal(
      t("manageDocumentsTitle"),
      t("summariesGeneratedSuccessfully"),
      [
        {
          label: t("ok"),
          value: "back",
        },
      ],
      function (action) {
        if (action === "back") {
          showDocumentsModal();
        }
      },
      { preventCloseOnBackdrop: true, hideCloseButton: true }
    );
  }

  /**
   * Sets up event listener for the #documents-btn
   */
  function setupEventListeners() {
    const btn = document.getElementById("documents-btn");
    if (!btn) return;
    btn.addEventListener("click", showDocumentsModal);
  }

  return {
    setupEventListeners,
    updateDocumentsButtonVisibility,
  };
})();
