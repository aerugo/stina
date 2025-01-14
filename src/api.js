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
        const provider = config.provider || 'azure';
        let url, headers, body;

        // Filter out undefined options
        const validOptions = Object.fromEntries(
            Object.entries(options).filter(([_, value]) => value !== undefined)
        );

        switch (provider) {
            case 'azure':
                url = `${config.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${API_VERSION}`;
                headers = {
                    'Content-Type': 'application/json',
                    'api-key': config.apiKey
                };
                body = {
                    messages: messages.map(message => ({
                        role: message.role,
                        content: message.content
                    })),
                    ...validOptions
                };
                break;

            case 'openai':
                // Always use the OpenAI API endpoint
                url = 'https://api.openai.com/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                };
                body = {
                    model: deploymentName,
                    messages: messages.map(message => ({
                        role: message.role,
                        content: message.content
                    })),
                    ...validOptions
                };
                break;

            case 'anthropic':
                // Use default endpoint if not provided
                const anthropicEndpoint = config.endpoint || 'https://api.anthropic.com/v1/complete';
                url = anthropicEndpoint;
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey
                };
                body = {
                    prompt: messages.map(message => message.content).join('\n'),
                    model: deploymentName,
                    max_tokens_to_sample: validOptions.max_tokens || 2048,
                    temperature: validOptions.temperature
                };
                break;

            case 'ollama':
                // Use default endpoint if not provided
                const ollamaEndpoint = config.endpoint || 'http://localhost:11434';
                url = `${ollamaEndpoint}/api/generate`;
                headers = {
                    'Content-Type': 'application/json'
                    // No API key needed for Ollama
                };
                body = {
                    model: deploymentName,
                    prompt: messages.map(message => message.content).join('\n'),
                    ...validOptions
                };
                break;

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }

        // Log the API request details
        console.log("Submitting API Request:", {
            provider,
            url,
            body: JSON.stringify(body, null, 2)
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage += `\n${JSON.stringify(errorData, null, 2)}`;
            } catch (e) {
                // Response is not JSON
                const errorText = await response.text();
                errorMessage += `\n${errorText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("API Response:", data);
        
        const parsedResult = parseApiResponse(data);
        return parsedResult;
    }

    function parseApiResponse(data) {
        const choice = data.choices[0];
        if (choice.finish_reason === "content_filter") {
            const filteredCategories = [];
            const contentFilterResults = choice.content_filter_results;

            // Iterate over each category to find which ones are filtered
            for (const [category, result] of Object.entries(contentFilterResults)) {
                if (result.filtered) {
                    filteredCategories.push(`${category} (severity: ${result.severity})`);
                }
            }

            const reasons = filteredCategories.join(', ');
            return {
                error: true,
                message: `The assistant's response was filtered due to policy compliance. Categories filtered: ${reasons}`,
            };
        }
        // Add additional checks for other non-standard responses if necessary
        return {
            error: false,
            message: choice.message,
        };
    }

    return {
        fetchChatCompletion
    };
})();
