/**
 * SummariesEventsModule
 * Handles UI and event interactions for generating document summaries.
 */
const SummariesEventsModule = (function () {
  function showSummarizationModal(file, onSummaryGenerated) {
    const modalContent = `
      <div class="field">
        <label class="label">${TranslationModule.translate("summarizationInstructions")}</label>
        <div class="control">
          <textarea id="summary-instructions" class="textarea" placeholder="${TranslationModule.translate("summarizationInstructionsPlaceholder")}"></textarea>
        </div>
      </div>
      <div class="field">
        <label class="label">${TranslationModule.translate("selectModel")}</label>
        <div class="control">
          <div class="select">
            <select id="summary-model-select">
              ${Object.entries(ModelsModule.getModels())
                .map(([key, model]) => `<option value="${key}">${model.name || key}</option>`)
                .join("")}
            </select>
          </div>
        </div>
      </div>
      <div id="summary-result" class="has-text-centered" style="margin-top: 1rem;"></div>
    `;

    ModalModule.showCustomModal(
      TranslationModule.translate("generateSummary"), 
      modalContent, 
      [
        { label: TranslationModule.translate("cancel"), value: false },
        { label: TranslationModule.translate("generate"), value: true, class: "is-primary" }
      ], 
      async function(result) {
        if (!result) return;  // User cancelled
        const instructions = document.getElementById("summary-instructions").value;
        const modelKey = document.getElementById("summary-model-select").value;
        
        // Replace the entire modal content with a loading indicator
        const modalBody = document.getElementById("custom-modal-body");
        modalBody.innerHTML = `
          <div class="has-text-centered">
            <p>${TranslationModule.translate("processingDocumentMessage") || "Generating summary..."}</p>
            <progress class="progress is-small is-primary" max="100">Loading</progress>
          </div>
        `;

        try {
          // Note: Use domain logic from SummariesModule here
          const { summaryText, summaryName } = await SummariesModule.generateSummary({
            docText: file.content,
            instructions,
            selectedModelKey: modelKey
          });
          
          const newSummary = {
            id: "summ_" + Date.now(),
            name: summaryName,
            content: summaryText,
            instructions,
            modelKey
          };
          
          // Close the modal
          const modal = document.getElementById("custom-modal");
          if (modal) modal.classList.remove("is-active");
          
          // Call the callback with the new summary
          onSummaryGenerated(newSummary);
          
        } catch (e) {
          // Show error in the modal
          modalBody.innerHTML = `
            <div class="has-text-centered">
              <p class="has-text-danger">${TranslationModule.translate("errorGeneratingSummary")}: ${e.message}</p>
              <button class="button is-primary mt-4" id="summary-error-close-btn">
                ${TranslationModule.translate("ok")}
              </button>
            </div>
          `;
          
          // Add event listener to close button
          setTimeout(() => {
            const closeBtn = document.getElementById("summary-error-close-btn");
            if (closeBtn) {
              closeBtn.addEventListener("click", () => {
                const modal = document.getElementById("custom-modal");
                if (modal) modal.classList.remove("is-active");
              });
            }
          }, 0);
        }
      }
    );
  }

  return {
    showSummarizationModal,
  };
})();
