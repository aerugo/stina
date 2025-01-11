/**
 * Controller Module
 * Coordinates interactions between modules and manages application flow.
 */
const ControllerModule = (function() {
    function initializeApp() {
        const state = ChatModule.initialize();
        if (state && state.chats && state.currentChatId !== undefined) {
            RenderingModule.renderChatList(state.chats, state.currentChatId);
            RenderingModule.renderConversation(state.conversation);
        } else {
            // Handle the error or initialize a new chat
            console.error("Failed to initialize chat state.");
        }
        EventModule.setupEventListeners();
        InputModule.setupEventListeners();
        ThemeModule.applyTheme(ThemeModule.getCurrentTheme());
    }

    async function sendMessage(messageContent) {
        const config = ConfigModule.getConfig();
        if (!config.endpoint || !config.apiKey) {
            throw new Error('Configuration not set');
        }

        const currentState = ChatModule.getCurrentState();
        const newMessage = { role: 'user', content: messageContent };
        currentState.conversation.push(newMessage);
        
        RenderingModule.renderConversation(currentState.conversation);
        MessageModule.saveConversation(currentState.currentChatId, currentState.conversation);

        const loadingMessage = { role: 'assistant', content: '', isLoading: true };
        currentState.conversation.push(loadingMessage);
        RenderingModule.renderConversation(currentState.conversation);

        try {
            // Retrieve selected model parameters
            const selectedModelParams = models[config.selectedModelKey];
            const deploymentName = selectedModelParams.deployment;

            // Prepare model options
            const modelOptions = {
                max_tokens: selectedModelParams.maxTokens,
                temperature: selectedModelParams.temperature,
                top_p: selectedModelParams.top_p,
                frequency_penalty: selectedModelParams.frequency_penalty,
                presence_penalty: selectedModelParams.presence_penalty,
                stop: selectedModelParams.stop
            };

            // Call the API with the correct deployment name and options
            const response = await ApiModule.fetchChatCompletion(
                currentState.conversation,
                deploymentName,
                modelOptions
            );
            
            currentState.conversation[currentState.conversation.length - 1] = {
                ...response,
                model: config.selectedModelKey
            };
            
            RenderingModule.renderConversation(currentState.conversation);
            MessageModule.saveConversation(currentState.currentChatId, currentState.conversation);

            const chat = ChatModule.getCurrentChat();
            if (chat.name === 'New chat') {
                const title = await MessageModule.generateChatTitle(messageContent);
                ChatModule.updateChatTitle(chat.id, title);
                RenderingModule.renderChatList(
                    ChatModule.getCurrentState().chats,
                    currentState.currentChatId
                );
            }
        } catch (error) {
            currentState.conversation.pop(); // Remove loading message
            RenderingModule.renderConversation(currentState.conversation);
            throw error;
        }
    }

    return {
        initializeApp,
        sendMessage
    };
})();
