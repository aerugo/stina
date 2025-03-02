/**
 * SummariesEventsModule
 * Handles UI and event interactions for generating document summaries.
 */
const SummariesEventsModule = (function () {
  function showSummarizationModal(file, onSummaryGenerated) {
    const modalContent = SummaryTemplates.getSummarizationModalContent();

    ModalModule.showCustomModal(
      TranslationModule.translate("generateSummary"), 
      modalContent, 
      [
        { label: TranslationModule.translate("cancel"), value: false },
        { label: TranslationModule.translate("generate"), value: "generate", class: "is-primary" }
      ], 
      async function(result) {
        if (result !== "generate") return;  // Only proceed for generation
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
  
        // Force the browser to render the new content
        await new Promise(resolve => setTimeout(resolve, 50));

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
          const sanitizedErrorMessage = DOMPurify.sanitize(e.message);
          modalBody.innerHTML = `
            <div class="has-text-centered">
              <p class="has-text-danger">${TranslationModule.translate("errorGeneratingSummary")}: ${sanitizedErrorMessage}</p>
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
