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

  AnthropicProvider.prototype.prepareMessages = function (messages, instruction) {
    // Store the system message content
    this.systemMessageContent = instruction ? instruction.content : "";
    // For Claude models, messages are an array without system messages
    return messages.filter((msg) => msg.role !== "system");
  };
  AnthropicProvider.prototype.fetchChatCompletion = async function (
    messages,
    deploymentName,
    options = {},
    providerConfig
  ) {
    let url = "https://api.anthropic.com/v1/complete";
    const isClaudeModel = deploymentName.startsWith("claude");
    if (isClaudeModel) {
      url = "https://api.anthropic.com/v1/messages";
    }

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": providerConfig.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };

    const validOptions = Object.fromEntries(
      Object.entries(options).filter(([_, value]) => value !== undefined)
    );

    let body;
    if (isClaudeModel) {
      // For Claude models, use the 'messages' array and include 'system' parameter
      const filteredMessages = messages.filter((msg) => msg.role !== "system");
      body = {
        model: deploymentName,
        messages: filteredMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_tokens_to_sample: validOptions.max_tokens || 1024,
        temperature: validOptions.temperature || 0.7,
      };
      if (this.systemMessageContent) {
        body.system = this.systemMessageContent;
      }
    } else {
      // For other models, construct the prompt manually
      body = {
        prompt: this.generateAnthropicPrompt(messages),
        model: deploymentName,
        max_tokens_to_sample: validOptions.max_tokens || 1024,
        temperature: validOptions.temperature || 0.7,
      };
    }

    const data = await this.makeApiRequest(url, headers, body);

    if (data.completion) {
      return {
        role: "assistant",
        content: data.completion.trim(),
      };
    } else if (data.content && Array.isArray(data.content)) {
      const assistantContent = data.content
        .map((part) => part.text)
        .join("")
        .trim();
      return {
        role: "assistant",
        content: assistantContent,
      };
    } else if (data.messages) {
      // For Claude models, the response is in 'messages'
      const assistantMessage = data.messages.find(
        (msg) => msg.role === "assistant"
      );
      if (assistantMessage) {
        return {
          role: "assistant",
          content: assistantMessage.content.trim(),
        };
      }
    }
    throw new Error("Invalid response from Anthropic API");
  }

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
  }
  return AnthropicProvider;
})();
