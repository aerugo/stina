const OpenAIProvider = (function () {
  function OpenAIProvider() {
    BaseProvider.call(this);
  }

  OpenAIProvider.prototype = Object.create(BaseProvider.prototype);
  OpenAIProvider.prototype.constructor = OpenAIProvider;

  OpenAIProvider.prototype.validateConfig = function (providerConfig) {
    if (!providerConfig.apiKey) {
      throw new Error("API Key is not set for OpenAI provider.");
    }
  };

  OpenAIProvider.prototype.prepareMessages = function (messages, instruction) {
    if (instruction) {
      messages.unshift({
        role: "system",
        content: instruction.content,
      });
    }
    return messages;
  };

  OpenAIProvider.prototype.fetchChatCompletion = async function (
    messages,
    deploymentName,
    options = {},
    providerConfig
  ) {
    const url = "https://api.openai.com/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${providerConfig.apiKey}`,
    };

    const validOptions = Object.fromEntries(
      Object.entries(options).filter(([_, value]) => value !== undefined)
    );

    const body = {
      model: deploymentName,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      ...validOptions,
    };

    const data = await this.makeApiRequest(url, headers, body);
    
    // Extract usage from the response via the BaseProvider helper
    const usage = this.parseUsage(data);
    
    return {
      role: data.choices[0].message.role,
      content:
        typeof data.choices[0].message.content === 'string'
          ? data.choices[0].message.content
          : data.choices[0].message.content.raw || data.choices[0].message.content.text || JSON.stringify(data.choices[0].message.content),
      usage: usage
    };
  };

  return OpenAIProvider;
})();
