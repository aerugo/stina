/**
 * DocumentsManagerEventsModule
 * Handles the "Manage Documents" button click and modal logic.
 */
const DocumentsManagerEventsModule = (function () {
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
   */
  function showDocumentsModal() {
    const docs = getAllDocuments();

    // Build the modal content
    let modalContent = `<div class="documents-manager-container">`;

    modalContent += `<p><strong>Documents in this chat:</strong></p>`;
    if (docs.length === 0) {
      modalContent += `<p>No documents available.</p>`;
      modalContent += `</div>`;
      ModalModule.showCustomModal("Manage Documents", modalContent, [
        { label: "OK", value: true },
      ]);
      return;
    }

    modalContent += `<div class="documents-list">`;
    docs.forEach((doc, idx) => {
      const docId = doc.id || "doc_" + idx;
      const docName = DOMPurify.sanitize(doc.fileName || "Untitled Document");
      const checkedFull = doc.useFullDocument ? "checked" : "";
      const isPending = FileUploadEventsModule.getPendingFiles().includes(doc)
        ? `<span style="color: orange;">(Pending)</span>`
        : "";

      // Summaries checkboxes
      let summariesHtml = "";
      if (doc.summaries && doc.summaries.length > 0) {
        summariesHtml = doc.summaries
          .map((summary) => {
            const isChecked =
              doc.selectedSummaryIds &&
              doc.selectedSummaryIds.includes(summary.id)
                ? "checked"
                : "";
            return `
              <label class="checkbox">
                <input type="checkbox" class="doc-summary-cb" 
                       data-doc-id="${docId}" data-summary-id="${summary.id}" 
                       ${isChecked}/>
                <span>${DOMPurify.sanitize(summary.name)}</span>
              </label>
            `;
          })
          .join("<br>");
      } else {
        summariesHtml = `<em>No existing summaries.</em>`;
      }

      modalContent += `
        <div class="document-item" style="margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 1rem;">
          <p><strong>${docName}</strong> ${isPending}</p>
          <label class="checkbox">
            <input type="checkbox" class="doc-full-cb" data-doc-id="${docId}" ${checkedFull}/>
            <span>Use Full Document</span>
          </label>
          <br>
          <p style="margin-top: 0.5rem;"><strong>Available Summaries:</strong></p>
          ${summariesHtml}
          <hr>
          <label class="checkbox">
            <input type="checkbox" class="doc-select-cb" data-doc-id="${docId}"/>
            <span>Select for New Summary</span>
          </label>
        </div>
      `;
    });
    modalContent += `</div>`; // end documents-list

    // Summaries generation options
    modalContent += `
    <div class="field" style="margin-top:1rem;">
      <label class="label">Summary Instructions</label>
      <div class="control">
        <textarea id="multi-doc-summary-instructions" class="textarea" rows="3"
          placeholder="Enter instructions for summarizing selected documents..."></textarea>
      </div>
    </div>
    <div class="field">
      <label class="label">Choose a Model</label>
      <div class="control">
        <div class="select">
          <select id="multi-doc-summary-model-select">
          </select>
        </div>
      </div>
    </div>
    `;

    modalContent += `</div>`; // close .documents-manager-container

    // Show the modal with a "Generate Summaries" button
    ModalModule.showCustomModal(
      "Manage Documents",
      modalContent,
      [
        { label: "Cancel", value: "cancel" },
        { label: "Generate Summaries", value: "generate", class: "is-primary" },
      ],
      async function (action) {
        if (action === "generate") {
          handleGenerateSummaries(docs);
        }
      }
    );

    // Populate model dropdown
    setTimeout(
      () => populateModelDropdown("multi-doc-summary-model-select"),
      0
    );

    // Attach event listeners for the checkboxes
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
    }, 0);
  }

  /**
   * Populates a <select> element with models that can be used for summary generation.
   * Re-uses logic from ModelSelectionEventsModule if desired, or just do a quick fill:
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

    // If user checks "Use Full Document", typically we’d clear doc.selectedSummaryIds
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
      // If user selects any summary, turn off useFullDocument
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
   * Called when user clicks "Generate Summaries" in the modal.
   * Gathers which docs are selected for new summaries, then calls SummariesEventsModule or SummariesModule to generate.
   * If multiple docs are selected, we run them in parallel.
   */
  async function handleGenerateSummaries(docs) {
    const instructions =
      document.getElementById("multi-doc-summary-instructions")?.value || "";
    const modelSelect = document.getElementById(
      "multi-doc-summary-model-select"
    );
    const selectedModelKey = modelSelect?.value || "gpt-4o";

    // Gather the docs that have "doc-select-cb" checked
    const checkboxes = document.querySelectorAll(".doc-select-cb:checked");
    if (checkboxes.length === 0) {
      ModalModule.showCustomAlert(
        "No documents selected for summary generation."
      );
      return;
    }

    // Prepare an array of docs to summarize
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
      ModalModule.showCustomAlert("No matching documents found.");
      return;
    }

    // Show a quick "Generating Summaries" message
    const modalBody = document.getElementById("custom-modal-body");
    modalBody.innerHTML = `
      <div style="text-align:center;">
        <p>Generating summaries for ${docsToSummarize.length} document(s)...</p>
        <progress class="progress is-small is-primary" max="100">Loading</progress>
      </div>
    `;

    // Generate in parallel
    const promises = docsToSummarize.map((doc) => {
      return SummariesModule.generateSummary({
        docText: doc.content,
        instructions,
        selectedModelKey,
      })
        .then(({ summaryText, summaryName }) => {
          // Insert the new summary into doc.summaries
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

          // By default, we can auto-select this new summary
          if (!doc.selectedSummaryIds) doc.selectedSummaryIds = [];
          doc.selectedSummaryIds.push(newSummary.id);
        })
        .catch((err) => {
          console.error(
            "Failed to generate summary for doc:",
            doc.fileName,
            err
          );
          // We won't fail the entire batch; just show an alert for each error
          ModalModule.showCustomAlert(
            `Error generating summary for ${doc.fileName}: ${err.message}`
          );
        });
    });

    await Promise.all(promises);

    // Once done, close the modal and re-render the conversation if needed
    const modal = document.getElementById("custom-modal");
    if (modal) modal.classList.remove("is-active");

    // Save conversation changes if any docs are part of the current chat
    ChatModule.saveChats();

    // If you want to re-open the modal so user can see newly added summaries:
    // showDocumentsModal();

    // Or just show a quick alert
    ModalModule.showCustomAlert("Summaries generated successfully!");
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
