class BaseProvider {
  async fetchChatCompletion(messages, deploymentName, options = {}, systemMessageContent = "", providerConfig) {
    throw new Error("fetchChatCompletion method not implemented.");
  }

  async makeApiRequest(url, headers, body) {
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
        const errorText = await response.text();
        errorMessage += `\n${errorText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }
}

export default BaseProvider;
