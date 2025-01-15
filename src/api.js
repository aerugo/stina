/**
 * API Module
 * Handles all interactions with the Azure OpenAI API.
 */
const ApiModule = (function () {
  const API_VERSION = "2024-12-01-preview";

  /**
   * Fetches a chat completion from the Azure OpenAI API.
   * @param {Array} messages - The conversation messages to send.
   * @param {string} deploymentName - Deployment name to use.
   * @param {Object} options - Additional API options.
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
    let url, headers, body;

    // Filter out undefined options
    const validOptions = Object.fromEntries(
      Object.entries(options).filter(([_, value]) => value !== undefined)
    );

    switch (provider) {
      case "azure":
        url = `${providerConfig.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${API_VERSION}`;
        headers = {
          "Content-Type": "application/json",
          "api-key": providerConfig.apiKey,
        };
        body = {
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          ...validOptions,
        };
        break;

      case "openai":
        // Use default OpenAI API endpoint
        url = "https://api.openai.com/v1/chat/completions";
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerConfig.apiKey}`,
        };
        body = {
          model: deploymentName, // Use the model name as per OpenAI API
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          ...validOptions,
        };
        break;

      case "anthropic":
        // Use Messages API endpoint
        url = "https://api.anthropic.com/v1/complete";

        // If model requires Messages API, use correct endpoint
        if (deploymentName.startsWith("claude")) {
          url = "https://api.anthropic.com/v1/messages";
        }

        headers = {
          "Content-Type": "application/json",
          "x-api-key": providerConfig.apiKey,
          "anthropic-version": "2023-06-01",
          // Add the header to enable CORS
          "anthropic-dangerous-direct-browser-access": "true",
        };

        if (url.endsWith("/v1/messages")) {
          // Adapt request body for Messages API
          // Filter out system messages from messages array
          const filteredMessages = messages.filter(
            (msg) => msg.role !== "system"
          );

          body = {
            model: deploymentName,
            messages: filteredMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            max_tokens: validOptions.max_tokens || 1024,
            temperature: validOptions.temperature || 0.7,
          };

          // If there's a system message, include it as a top-level parameter
          if (systemMessageContent) {
            body.system = systemMessageContent;
          }
        } else {
          // Use old format if needed
          body = {
            prompt: generateAnthropicPrompt(messages),
            model: deploymentName,
            max_tokens_to_sample: validOptions.max_tokens || 1024,
            temperature: validOptions.temperature || 0.7,
          };
        }
        break;

      case "ollama":
        // Use default endpoint if not provided
        const ollamaEndpoint = providerConfig.endpoint || "http://localhost:11434";
        url = `${ollamaEndpoint}/api/chat`;
        headers = {
          "Content-Type": "application/json",
          // No API key needed for Ollama
        };
        body = {
          model: deploymentName,
          prompt: systemMessageContent || "", // Include system message
          stream: false,
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          ...validOptions,
        };
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Log the API request details
    console.log("Submitting API Request:", {
      url,
      method: "POST",
      headers: headers,
      body: JSON.stringify(body, null, 2),
    });

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
        // Response is not JSON
        const errorText = await response.text();
        errorMessage += `\n${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("API Response:", data);

    const parsedResult = parseApiResponse(data, provider);
    return parsedResult;
  }

  function parseApiResponse(data, provider) {
    if (provider === "ollama") {
      if (data.error) {
        return {
          error: true,
          message: data.error.message || "Unknown error from Ollama API",
        };
      }
      if (data.message && data.message.content) {
        return {
          error: false,
          message: {
            role: "assistant",
            content: data.message.content.trim(),
          },
        };
      } else {
        return {
          error: true,
          message: "Invalid response from Ollama API",
        };
      }
    }

    if (!data.choices || !data.choices[0]) {
      return {
        error: true,
        message: "Invalid response from the API.",
      };
    }

    if (provider === "anthropic") {
      if (data.error) {
        return {
          error: true,
          message: data.error.message || "Unknown error from Anthropic API",
        };
      }

      if (data.completion) {
        // Response from /v1/complete
        return {
          error: false,
          message: {
            role: "assistant",
            content: data.completion.trim(),
          },
        };
      } else if (data.content) {
        // Response from /v1/messages
        // Assistant's response is in data.content as an array of text parts
        const assistantContent = data.content
          .map((part) => part.text)
          .join("")
          .trim();
        return {
          error: false,
          message: {
            role: "assistant",
            content: assistantContent,
          },
        };
      } else {
        return {
          error: true,
          message: "Invalid response from Anthropic API",
        };
      }
    }

    const choice = data.choices[0];
    if (choice.finish_reason === "content_filter") {
      const filteredCategories = [];
      const contentFilterResults = choice.content_filter_results;

      // Iterate over each category to find which ones are filtered
      for (const [category, result] of Object.entries(contentFilterResults)) {
        if (result.filtered) {
          filteredCategories.push(`${category} (severity: ${result.severity})`);
        }
      }

      const reasons = filteredCategories.join(", ");
      return {
        error: true,
        message: `The assistant's response was filtered due to policy compliance. Categories filtered: ${reasons}`,
      };
    }
    // Add additional checks for other non-standard responses if necessary
    return {
      error: false,
      message: choice.message,
    };
  }

  // Helper function to format messages for Anthropic API
  function generateAnthropicPrompt(messages) {
    let prompt = "";
    messages.forEach((message) => {
      if (message.role === "user") {
        prompt += `\n\nHuman: ${message.content}`;
      } else if (message.role === "assistant") {
        prompt += `\n\nAssistant: ${message.content}`;
      }
    });
    prompt += `\n\nAssistant:`;
    return prompt.trim();
  }

  return {
    fetchChatCompletion,
  };
})();
