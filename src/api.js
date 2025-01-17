const ApiModule = (function () {
  const providers = {
    azure: AzureProvider,
    openai: OpenAIProvider,
    anthropic: AnthropicProvider,
    ollama: OllamaProvider,
  };
  /**
   * Fetches a chat completion using the specified provider.
   * @param {Array} messages - The conversation messages to send.
   * @param {string} deploymentName - Deployment name or model name to use.
   * @param {Object} options - Additional API options.
   * @param {string} systemMessageContent - System message content.
   * @param {string} provider - The API provider to use.
   * @param {Object} providerConfig - Provider-specific configuration.
   * @returns {Promise<Object>} - The assistant's response message.
   * @throws Will throw an error if the API call fails.
   */
  async function fetchChatCompletion(
    messages,
    deploymentName,
    options = {},
    systemMessageContent = "",
    provider,
    providerConfig
  ) {
    const ProviderClass = providers[provider];
    if (!ProviderClass) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    const providerInstance = new ProviderClass();
    return await providerInstance.fetchChatCompletion(
      messages,
      deploymentName,
      options,
      systemMessageContent,
      providerConfig
    );
  }

  return {
    fetchChatCompletion,
  };
})();
