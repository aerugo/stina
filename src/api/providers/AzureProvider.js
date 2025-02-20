const AzureProvider = (function () {
  function AzureProvider() {
    BaseProvider.call(this);
  }

  AzureProvider.prototype = Object.create(BaseProvider.prototype);
  AzureProvider.prototype.constructor = AzureProvider;

  AzureProvider.prototype.validateConfig = function (providerConfig) {
    if (!providerConfig.apiKey || !providerConfig.endpoint) {
      throw new Error("API Key or Endpoint is not set for Azure provider.");
    }
  };

  AzureProvider.prototype.prepareMessages = function (messages, instruction) {
    if (instruction) {
      messages.unshift({
        role: "system",
        content: instruction.content,
      });
    }
    return messages;
  };

  AzureProvider.prototype.fetchChatCompletion = async function (
    messages,
    deploymentName,
    options = {},
    providerConfig
  ) {
    const API_VERSION = "2024-12-01-preview";
    const url = `${providerConfig.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${API_VERSION}`;
    const headers = {
      "Content-Type": "application/json",
      "api-key": providerConfig.apiKey,
    };

    const validOptions = Object.fromEntries(
      Object.entries(options).filter(([_, value]) => value !== undefined)
    );

    const body = {
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      ...validOptions,
    };

    const data = await this.makeApiRequest(url, headers, body);
    console.log("data!");
    console.log(data);
    return data.choices[0].message;
  };

  return AzureProvider;
})();
