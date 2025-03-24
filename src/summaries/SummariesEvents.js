/**
 * SummariesEventsModule
 * Handles UI and event interactions for generating document summaries.
 */
const SummariesEventsModule = (function () {
  function showSummarizationModal(file, onSummaryGenerated) {
    const docClassificationLevel = file.classificationLevel || 1;
    const modalContent = SummaryTemplates.getSummarizationModalContent(
      docClassificationLevel
    );

    ModalModule.showCustomModal(
      TranslationModule.translate("generateSummary"),
      modalContent,
      [
        { label: TranslationModule.translate("cancel"), value: false },
        {
          label: TranslationModule.translate("generate"),
          value: "generate",
          class: "is-primary",
        },
      ],
      async function (result) {
        if (result !== "generate") return; // Only proceed for generation

        // After modal is rendered, check if the model selector has a single disabled option.
        setTimeout(() => {
          const selectEl = document.getElementById("summary-model-select");
          if (
            selectEl &&
            selectEl.options.length === 1 &&
            selectEl.options[0].disabled
          ) {
            const generateButton = document.querySelector(
              "#custom-modal .button.is-primary"
            );
            if (generateButton) {
              generateButton.setAttribute("disabled", "disabled");
              generateButton.classList.add("is-disabled");
            }
          }
        }, 50);
        const instructions = document.getElementById(
          "summary-instructions"
        ).value;
        const modelKey = document.getElementById("summary-model-select").value;

        // Retrieve model parameters and check clearance against document classification
        const modelParams = ModelsModule.getModel(modelKey);
        const modelClearance = modelParams.classification_clearance || 1;
        const docLevel = file.classificationLevel || 1;
        if (modelClearance < docLevel) {
          ModalModule.showCustomAlert(
            `Model clearance (${modelClearance}) is too low for document classification (${docLevel}).`
          );
          return; // Stop summary generation
        }

        // Replace the entire modal content with a loading indicator
        const modalBody = document.getElementById("custom-modal-body");
        modalBody.innerHTML = `
          <div class="has-text-centered">
            <p>${
              TranslationModule.translate("processingDocumentMessage") ||
              "Generating summary..."
            }</p>
            <progress class="progress is-small is-primary" max="100">Loading</progress>
          </div>
        `;

        // Force the browser to render the new content
        await new Promise((resolve) => setTimeout(resolve, 50));

        try {
          // Note: Use domain logic from SummariesModule here
          const { summaryText, summaryName } =
            await SummariesModule.generateSummary({
              docText: file.content,
              instructions,
              selectedModelKey: modelKey,
            });

          const newSummary = {
            id: "summ_" + Date.now(),
            name: summaryName,
            content: summaryText,
            instructions,
            modelKey,
          };

          // Close the modal
          const modal = document.getElementById("custom-modal");
          if (modal) modal.classList.remove("is-active");

          // Call the callback with the new summary
          onSummaryGenerated(newSummary);
        } catch (e) {
          const sanitizedErrorMessage = DOMPurify.sanitize(e.message);
          const oldInstructions = instructions;
          const oldModelKey = modelKey;

          modalBody.innerHTML = `
            <div class="has-text-centered">
              <p class="has-text-danger">
                ${TranslationModule.translate(
                  "errorGeneratingSummary"
                )}: ${sanitizedErrorMessage}
              </p>
              <button class="button is-primary mt-4" id="summary-error-close-btn">
                ${TranslationModule.translate("ok")}
              </button>
            </div>
          `;

          setTimeout(() => {
            const closeBtn = document.getElementById("summary-error-close-btn");
            if (closeBtn) {
              closeBtn.addEventListener("click", () => {
                // Instead of closing everything:
                // Re-open the Summarization Modal with the same instructions/model
                showSummarizationModal(file, onSummaryGenerated);

                // Or, if you prefer to preserve typed instructions:
                // showSummarizationModal(file, onSummaryGenerated, oldInstructions, oldModelKey);
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
