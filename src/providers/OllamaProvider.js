import BaseProvider from './BaseProvider';

class OllamaProvider extends BaseProvider {
  async fetchChatCompletion(messages, deploymentName, options = {}, systemMessageContent = "", providerConfig) {
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
      prompt: systemMessageContent || "",
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
  }
}

export default OllamaProvider;
