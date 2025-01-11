/**
 * API Module
 * Handles all interactions with the Azure OpenAI API.
 */
var ApiModule = (function() {
    const API_VERSION = '2024-12-01-preview';

    /**
     * Fetches a chat completion from the Azure OpenAI API.
     * @param {Array} messages - The conversation messages to send.
     * @param {string} deploymentName - Deployment name to use.
     * @param {Object} options - Additional API options.
     * @returns {Promise<Object>} - The assistant's response message.
     * @throws Will throw an error if the API call fails.
     */
    async function fetchChatCompletion(messages, deploymentName, options = {}) {
        const config = ConfigModule.getConfig();
        const url = `${config.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${API_VERSION}`;

        // Filter out undefined options
        const validOptions = Object.fromEntries(
            Object.entries(options).filter(([_, value]) => value !== undefined)
        );

        // Prepare the request body
        const body = {
            messages: messages.map(message => ({
                role: message.role,
                content: message.content
            })),
            ...validOptions
        };

        // Log the API request details
        console.log("Submitting API Request:", {
            url,
            body: JSON.stringify(body, null, 2)
        });

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
                })),
                ...validOptions
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
