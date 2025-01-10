/**
 * Logic Module
 * Handles application logic such as chat and conversation management.
 */
const LogicModule = (function() {
    // Private variables
    let chats = JSON.parse(localStorage.getItem('chats')) || [];
    let currentChatId = localStorage.getItem('currentChatId');
    let conversation = [];

    // Configuration
    let endpoint = localStorage.getItem('endpoint') || '';
    let deployment = localStorage.getItem('deployment') || '';
    let apiKey = localStorage.getItem('apiKey') || '';

    function createNewChat() {
        const chatId = Date.now().toString();
        const chat = {
            id: chatId,
            name: `Chat ${chats.length + 1}`,
            conversation: []
        };
        chats.push(chat);
        currentChatId = chatId;
        conversation = chat.conversation;
        saveChats();
        saveCurrentChatId();
        return {
            chats,
            currentChatId,
            conversation
        };
    }

    function loadChat(chatId) {
        currentChatId = chatId;
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            conversation = chat.conversation;
            saveCurrentChatId();
            return {
                chats,
                conversation,
                currentChatId,
                success: true
            };
        }
        return { success: false };
    }

    function saveChats() {
        localStorage.setItem('chats', JSON.stringify(chats));
    }

    function saveCurrentChatId() {
        localStorage.setItem('currentChatId', currentChatId);
    }

    function saveConversation() {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.conversation = conversation;
            saveChats();
        }
    }

    function deleteChat(chatId) {
        chats = chats.filter(chat => chat.id !== chatId);
        if (currentChatId === chatId) {
            if (chats.length > 0) {
                return loadChat(chats[0].id);
            } else {
                return createNewChat();
            }
        }
        saveChats();
        return { chats, currentChatId };
    }

    function updateConfig(newEndpoint, newDeployment, newApiKey) {
        endpoint = newEndpoint;
        deployment = newDeployment;
        apiKey = newApiKey;
        localStorage.setItem('endpoint', endpoint);
        localStorage.setItem('deployment', deployment);
        localStorage.setItem('apiKey', apiKey);
    }

    function getConfig() {
        return {
            endpoint,
            deployment,
            apiKey
        };
    }

    async function fetchAzureOpenAIChatCompletion(messages) {
        const body = {
            messages,
            max_tokens: 800,
            temperature: 0.7,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
            stream: false
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();
        return data.choices[0].message;
    }

    function getCurrentState() {
        return {
            chats,
            currentChatId,
            conversation
        };
    }

    function initialize() {
        if (chats.length === 0) {
            return createNewChat();
        } else if (currentChatId) {
            return loadChat(currentChatId);
        } else {
            return loadChat(chats[0].id);
        }
    }

    return {
        initialize,
        createNewChat,
        loadChat,
        deleteChat,
        updateConfig,
        getConfig,
        fetchAzureOpenAIChatCompletion,
        getCurrentState,
        saveConversation
    };
})();
