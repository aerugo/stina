import BaseProvider from './BaseProvider';

class OpenAIProvider extends BaseProvider {
  async fetchChatCompletion(messages, deploymentName, options = {}, systemMessageContent = "", providerConfig) {
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
    return data.choices[0].message;
  }
}

export default OpenAIProvider;
