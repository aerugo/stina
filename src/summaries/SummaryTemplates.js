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
              ${Object.entries(ModelsModule.getModels())
                .map(([key, model]) => {
                  const modelClearance = model.classification_clearance || 1;
                  const isDisabled = modelClearance < docClassificationLevel;
                  return `<option value="${key}" ${isDisabled ? 'disabled' : ''}>${model.name || key}${isDisabled ? ' (insufficient clearance)' : ''}</option>`;
                })
                .join("")}
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
