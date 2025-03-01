/**
 * Summaries Module
 * Handles document summarization functionality
 */
const SummariesModule = (function() {
  // Reuse the provider mapping
  const providers = {
    azure: AzureProvider,
    openai: OpenAIProvider,
    anthropic: AnthropicProvider,
    ollama: OllamaProvider,
  };

  async function generateSummary({ docText, instructions, selectedModelKey }) {
    const models = ModelsModule.getModels();
    const modelParams = models[selectedModelKey];
    if (!modelParams) throw new Error("Model not found: " + selectedModelKey);

    const provider = modelParams.provider;
    const ProviderClass = providers[provider];
    if (!ProviderClass) throw new Error("Unsupported provider: " + provider);
    const providerInstance = new ProviderClass();

    // Validate config as usual:
    const config = ConfigModule.getConfig();
    providerInstance.validateConfig(config.providerConfigs[provider] || {});

    // Build a combined prompt
    const prompt = `
Instructions for summary:
${instructions}

Document content:
${docText}

Please provide:
1) A concise plain text summary.
2) A short summary title that follows "Summary with focus on ..." (max 50 characters)
    `;
    const messages = [{ role: "user", content: prompt }];
    const conversationToSend = providerInstance.prepareMessages(messages);
    const modelOptions = {
      max_tokens: modelParams.max_tokens,
      temperature: modelParams.temperature,
      top_p: modelParams.top_p,
      frequency_penalty: modelParams.frequency_penalty,
      presence_penalty: modelParams.presence_penalty,
      stop: modelParams.stop,
    };

    const deploymentName = config.titleDeployment || modelParams.deployment;
    const apiResponse = await providerInstance.fetchChatCompletion(
      conversationToSend,
      deploymentName,
      modelOptions,
      config.providerConfigs[provider] || {}
    );

    const rawText = apiResponse.content.trim();
    const [summaryText, summaryName] = parseSummaryOutput(rawText);
    return { summaryText, summaryName };
  }

  function parseSummaryOutput(text) {
    // A basic parsing strategy: look for title indicators
    if (text.includes("Title:")) {
      const parts = text.split(/Title:/i);
      const summaryText = parts[0].trim();
      const summaryName = parts[1] ? parts[1].trim() : "Summary";
      return [summaryText, summaryName];
    } else if (text.includes("Summary title:")) {
      const parts = text.split(/Summary title:/i);
      const summaryText = parts[0].trim();
      const summaryName = parts[1] ? parts[1].trim() : "Summary";
      return [summaryText, summaryName];
    } else {
      // If no explicit title found, use first 50 chars as title
      const summaryName = text.length > 50 ? text.substring(0, 50) + "..." : text;
      return [text, summaryName];
    }
  }

  function showSummarizationModal(file, onSummaryGenerated) {
    const modalContent = `
      <div class="field">
        <label class="label">Summarization Instructions</label>
        <div class="control">
          <textarea id="summary-instructions" class="textarea" placeholder="e.g., Focus on legal aspects"></textarea>
        </div>
      </div>
      <div class="field">
        <label class="label">Select Model</label>
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
      "Generate Summary", 
      modalContent, 
      [
        { label: TranslationModule.translate("cancel"), value: false },
        { label: TranslationModule.translate("generate"), value: true, class: "is-primary" }
      ], 
      async function(result) {
        if (result) {
          const instructions = document.getElementById("summary-instructions").value;
          const modelKey = document.getElementById("summary-model-select").value;
          // Show a loading indicator:
          const summaryResultElem = document.getElementById("summary-result");
          summaryResultElem.innerHTML = `<progress class="progress is-small is-primary" max="100">Loading</progress>`;

          try {
            const summaryResponse = await SummariesModule.generateSummary({
              docText: file.content,
              instructions,
              selectedModelKey: modelKey
            });
            
            // Create the new summary object
            const newSummary = {
              id: "summ_" + Date.now(),
              name: summaryResponse.summaryName,
              content: summaryResponse.summaryText,
              instructions,
              modelKey
            };
            
            // Call back with the generated summary
            onSummaryGenerated(newSummary);
            
            // Close the modal automatically
            const modal = document.getElementById("custom-modal");
            if (modal) {
              modal.classList.remove("is-active");
            }
          } catch (e) {
            summaryResultElem.innerHTML = `<p class="has-text-danger">Error generating summary: ${e.message}</p>`;
          }
        }
      }
    );
  }

  return {
    generateSummary,
    showSummarizationModal
  };
})();
