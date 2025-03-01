/**
 * SummariesModule
 * Contains the domain / business logic for generating summaries.
 */
const SummariesModule = (function () {
  // Reuse the provider mapping just like the Chat feature
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

    const config = ConfigModule.getConfig();
    providerInstance.validateConfig(config.providerConfigs[provider] || {});

    // Build two separate prompts—
    // one for generating the summary and one for the title.
    const summaryPrompt = `
Instructions for summary:
${instructions}

Document content:
${docText}

Please provide a concise plain text summary.
    `;

    const titlePrompt = `
Instructions for summary title:
${instructions}

Document content:
${docText}

Please provide a short summary title that follows "Summary with focus on ..." (max 50 characters).
    `;

    // Prepare messages (using the provider's prepareMessages method)
    const summaryMessages = providerInstance.prepareMessages([{ role: "user", content: summaryPrompt }]);
    const titleMessages = providerInstance.prepareMessages([{ role: "user", content: titlePrompt }]);

    // Use the same model parameters for both calls
    const modelOptions = {
      max_tokens: modelParams.max_tokens,
      temperature: modelParams.temperature,
      top_p: modelParams.top_p,
      frequency_penalty: modelParams.frequency_penalty,
      presence_penalty: modelParams.presence_penalty,
      stop: modelParams.stop,
    };

    const deploymentName = config.titleDeployment || modelParams.deployment;

    // Run both API calls in parallel
    const [summaryResponse, titleResponse] = await Promise.all([
      providerInstance.fetchChatCompletion(
        summaryMessages,
        deploymentName,
        modelOptions,
        config.providerConfigs[provider] || {}
      ),
      providerInstance.fetchChatCompletion(
        titleMessages,
        deploymentName,
        modelOptions,
        config.providerConfigs[provider] || {}
      )
    ]);

    // Return the results directly, no parsing needed.
    return {
      summaryText: summaryResponse.content.trim(),
      summaryName: titleResponse.content.trim()
    };
  }

  return {
    generateSummary,
  };
})();
