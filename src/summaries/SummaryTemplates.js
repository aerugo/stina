/**
 * SummaryTemplates Module
 * Provides HTML templates for the Summaries feature.
 */
const SummaryTemplates = (function () {
  /**
   * Returns the HTML content for the summmarization modal.
   */
  function getSummarizationModalContent() {
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
                .map(([key, model]) => `<option value="${key}">${model.name || key}</option>`)
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
