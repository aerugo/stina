const OllamaProvider = (function () {
  function OllamaProvider() {
    BaseProvider.call(this);
  }

  OllamaProvider.prototype = Object.create(BaseProvider.prototype);
  OllamaProvider.prototype.constructor = OllamaProvider;

  OllamaProvider.prototype.validateConfig = function (providerConfig) {
    // No validation needed for Ollama
  };

  OllamaProvider.prototype.prepareMessages = function (messages, instruction) {
    this.systemMessageContent = instruction ? instruction.content : "";
    return messages;
  };

  OllamaProvider.prototype.fetchChatCompletion = async function (
    messages,
    deploymentName,
    options = {},
    providerConfig
  ) {
    const ollamaEndpoint = providerConfig.endpoint || "http://localhost:11434";
    const url = `${ollamaEndpoint}/api/chat`;
    const headers = {
      "Content-Type": "application/json",
    };

    const validOptions = Object.fromEntries(
      Object.entries(options).filter(([_, value]) => value !== undefined)
    );

    const body = {
      model: deploymentName,
      prompt: this.systemMessageContent || "",
      stream: false,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      ...validOptions,
    };

    const data = await this.makeApiRequest(url, headers, body);

    if (data.error) {
      throw new Error(data.error.message || "Unknown error from Ollama API");
    }

    if (data.message && data.message.content) {
      return {
        role: "assistant",
        content: data.message.content.trim(),
      };
    } else {
      throw new Error("Invalid response from Ollama API");
    }
  };

  return OllamaProvider;
})();
