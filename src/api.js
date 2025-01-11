/**
 * API Module
 * Handles all interactions with the Azure OpenAI API.
 */
const ApiModule = (function() {
    const API_VERSION = '2024-12-01-preview';

    /**
     * Fetches a chat completion from the Azure OpenAI API.
     * @param {Array} messages - The conversation messages to send.
     * @param {string} deploymentName - Deployment name to use.
     * @returns {Promise<Object>} - The assistant's response message.
     * @throws Will throw an error if the API call fails.
     */
    async function fetchChatCompletion(messages, deploymentName) {
        const config = ConfigModule.getConfig();
        const url = `${config.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${API_VERSION}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.apiKey
            },
            body: JSON.stringify({
                messages: messages.map(message => ({
                    role: message.role,
                    content: message.content
                }))
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();
        return data.choices[0].message;
    }

    return {
        fetchChatCompletion
    };
})();
