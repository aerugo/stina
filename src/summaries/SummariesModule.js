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
      const summaryName = text.length > 50 ? text.substring(0, 50) + "..." : text;
      return [text, summaryName];
    }
  }

  return {
    generateSummary,
  };
})();
