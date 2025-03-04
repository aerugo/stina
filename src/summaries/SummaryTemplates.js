/**
 * SummaryTemplates Module
 * Provides HTML templates for the Summaries feature.
 */
const SummaryTemplates = (function () {
  /**
   * Returns the HTML content for the summmarization modal.
   * @param {number} docClassificationLevel - The classification level of the document
   */
  function getSummarizationModalContent(docClassificationLevel = 1) {
    // Build an array of model options with clearance info
    const modelsArray = Object.entries(ModelsModule.getModels()).map(([key, model]) => {
      const modelClearance = model.classification_clearance || 1;
      return {
        key,
        label: model.name || key,
        isDisabled: modelClearance < docClassificationLevel,
      };
    });
    // Determine whether any model meets clearance
    const availableOptions = modelsArray.filter(m => !m.isDisabled);
    let optionsHTML = "";
    if (availableOptions.length === 0) {
      optionsHTML = `<option disabled>No available models with sufficient clearance</option>`;
    } else {
      optionsHTML = modelsArray
        .map(m => 
          `<option value="${m.key}" ${m.isDisabled ? "disabled" : ""}>` +
          `${m.label}${m.isDisabled ? " (insufficient clearance)" : ""}` +
          `</option>`
        )
        .join("");
    }

    return `
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
              ${optionsHTML}
            </select>
          </div>
        </div>
      </div>
      <div id="summary-result" class="has-text-centered" style="margin-top: 1rem;"></div>
    `;
  }

  return {
    getSummarizationModalContent,
  };
})();
