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
    this.systemMessageContent = instruction ? instruction.content : "";
    return messages.filter((msg) => msg.role !== "system");
  };
  AnthropicProvider.prototype.fetchChatCompletion = async function (
    messages,
    deploymentName,
    options = {},
    systemMessageContent = "",
    providerConfig
  ) {
    let url = "https://api.anthropic.com/v1/complete";
    if (deploymentName.startsWith("claude")) {
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
    if (url.endsWith("/v1/messages")) {
      const filteredMessages = messages.filter((msg) => msg.role !== "system");
      body = {
        model: deploymentName,
        messages: filteredMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_tokens: validOptions.max_tokens || 1024,
        temperature: validOptions.temperature || 0.7,
      };
      if (systemMessageContent) {
        body.system = systemMessageContent;
      }
    } else {
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
    } else if (data.content) {
      const assistantContent = data.content
        .map((part) => part.text)
        .join("")
        .trim();
      return {
        role: "assistant",
        content: assistantContent,
      };
    }
  }

  AnthropicProvider.prototype.generateAnthropicPrompt = function (messages) {
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
  return AnthropicProvider;
})();
