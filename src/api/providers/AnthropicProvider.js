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
    // Store the instruction content in an instance variable
    this.systemMessageContent = instruction ? instruction.content : "";

    // Filter out any 'system' role messages, keeping only 'user' and 'assistant' roles
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
    const url = "https://api.anthropic.com/v1/messages";

    const headers = {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
      "anthropic-version": "2023-06-01",
      "x-api-key": providerConfig.apiKey,
    };

    // Prepare the API request body
    const body = {
      model: deploymentName,
      max_tokens: options.max_tokens || 500,
      temperature: options.temperature || 0.7,
      top_p: options.top_p !== undefined ? options.top_p : 0.95,
      system: this.systemMessageContent, // Include the system prompt
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    };

    // Make the API request
    const data = await this.makeApiRequest(url, headers, body);

    // Handle the response
    if (Array.isArray(data.content)) {
      // Concatenate all text parts from the content array
      const assistantContent = data.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      return {
        role: "assistant",
        content: assistantContent.trim(),
      };
    } else {
      throw new Error("Invalid response from Anthropic API");
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
