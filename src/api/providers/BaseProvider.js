const BaseProvider = (function () {
  function BaseProvider() {}

  BaseProvider.prototype.fetchChatCompletion = async function (
    messages,
    deploymentName,
    options = {},
    providerConfig
  ) {
    throw new Error("fetchChatCompletion method not implemented.");
  };

  BaseProvider.prototype.validateConfig = function (providerConfig) {
    // Default implementation does nothing
  };

  BaseProvider.prototype.prepareMessages = function (messages, instruction) {
    // Default implementation returns messages unmodified
    return messages;
  };

  BaseProvider.prototype.makeApiRequest = async function (url, headers, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage += `\n${JSON.stringify(errorData, null, 2)}`;
      } catch (e) {
        const errorText = await response.text();
        errorMessage += `\n${errorText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  /**
   * Helper to extract token usage from the API response.
   * Returns an object with prompt_tokens, completion_tokens, and total_tokens,
   * or zeroes if not available.
   * @param {object} data - The raw response data from the API.
   * @returns {object} Usage information.
   */
  BaseProvider.prototype.parseUsage = function (data) {
    if (!data || !data.usage) {
      return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    }
    return {
      prompt_tokens: data.usage.prompt_tokens || 0,
      completion_tokens: data.usage.completion_tokens || 0,
      total_tokens: data.usage.total_tokens || 0,
    };
  };

  return BaseProvider;
})();
