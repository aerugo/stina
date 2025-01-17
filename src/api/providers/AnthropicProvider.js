const AnthropicProvider = (function () {
  function AnthropicProvider() {
    BaseProvider.call(this);
  }

  AnthropicProvider.prototype = Object.create(BaseProvider.prototype);
  AnthropicProvider.prototype.constructor = AnthropicProvider;

  AnthropicProvider.prototype.validateConfig = function (providerConfig) {
    if (!providerConfig.apiKey) {
      throw new Error("API Key is not set for Anthropic provider.");
    }
  };

  AnthropicProvider.prototype.prepareMessages = function (
    messages,
    instruction
  ) {
    // Store the system message content
    this.systemMessageContent = instruction ? instruction.content : "";
    // Return messages with roles 'user' and 'assistant' only
    return messages.filter(
      (msg) => msg.role === "user" || msg.role === "assistant"
    );
  };
  AnthropicProvider.prototype.fetchChatCompletion = async function (
    messages,
    deploymentName,
    options = {},
    providerConfig
  ) {
    // Set the API endpoint for Claude models
    const url = "https://api.anthropic.com/v1/messages";

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
      "anthropic-version": "2023-06-01",
      "x-api-key": providerConfig.apiKey,
    };

    // Filter out any 'system' role messages from the messages array
    const filteredMessages = messages.filter(
      (msg) => msg.role === "user" || msg.role === "assistant"
    );

    // Map messages to the required format
    const formattedMessages = filteredMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // Prepare model options with correct parameter names
    const modelOptions = {
      model: deploymentName,
      max_tokens: options.max_tokens || 1024,
      temperature: options.temperature || 0.7,
      // Include 'top_p' if it's specified
      ...(options.top_p !== undefined && { top_p: options.top_p }),
      // Include the 'system' message if present
      ...(this.systemMessageContent && { system: this.systemMessageContent }),
      messages: formattedMessages,
    };

    // Make the API request
    const data = await this.makeApiRequest(url, headers, modelOptions);

    // Handle the response
    if (Array.isArray(data.content)) {
      // Concatenate all text parts from the content array
      const assistantContent = data.content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');

      return {
        role: 'assistant',
        content: assistantContent.trim(),
      };
    } else {
      throw new Error('Invalid response from Anthropic API');
    }
  };

  AnthropicProvider.prototype.generateAnthropicPrompt = function (messages) {
    let prompt = "";
    if (this.systemMessageContent) {
      prompt += `\n\n${this.systemMessageContent}`;
    }
    messages.forEach((message) => {
      if (message.role === "user") {
        prompt += `\n\nHuman: ${message.content}`;
      } else if (message.role === "assistant") {
        prompt += `\n\nAssistant: ${message.content}`;
      }
    });
    prompt += `\n\nAssistant:`;
    return prompt.trim();
  };
  return AnthropicProvider;
})();
