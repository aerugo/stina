/**
 * Input Module
 * Handles user input and event listeners
 */
const InputModule = (function() {
    function setupEventListeners() {
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const newChatBtn = document.getElementById('new-chat-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettings = document.getElementById('close-settings');
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const chatList = document.getElementById('chat-list');

        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        newChatBtn.addEventListener('click', () => {
            const state = LogicModule.createNewChat();
            RenderingModule.renderChatList(state.chats, state.currentChatId);
            RenderingModule.renderConversation(state.conversation);
        });

        settingsBtn.addEventListener('click', openSettingsModal);
        closeSettings.addEventListener('click', closeSettingsModal);
        saveSettingsBtn.addEventListener('click', saveSettings);

        chatList.addEventListener('click', (e) => {
            const chatName = e.target.closest('.chat-name');
            const deleteBtn = e.target.closest('.delete-chat-btn');
            const chatItem = e.target.closest('li');

            if (!chatItem) return;

            const chatId = chatItem.dataset.chatId;

            if (chatName) {
                const result = LogicModule.loadChat(chatId);
                if (result.success) {
                    RenderingModule.renderChatList(
                        LogicModule.getCurrentState().chats,
                        result.currentChatId
                    );
                    RenderingModule.renderConversation(result.conversation);
                } else {
                    alert('Chat not found.');
                }
            } else if (deleteBtn) {
                const chat = LogicModule.getCurrentState().chats.find(c => c.id === chatId);
                const confirmDelete = confirm(
                    `Are you sure you want to delete "${chat.name}"? This action cannot be undone.`
                );
                if (confirmDelete) {
                    const state = LogicModule.deleteChat(chatId);
                    RenderingModule.renderChatList(state.chats, state.currentChatId);
                }
            }
        });

        window.addEventListener('click', (event) => {
            if (event.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }

    async function sendMessage() {
        const userInput = document.getElementById('user-input');
        const messageContent = userInput.value.trim();
        if (messageContent === '') return;

        const config = LogicModule.getConfig();
        if (!config.endpoint || !config.deployment || !config.apiKey) {
            alert('Please set your configuration in the settings before sending messages.');
            return;
        }

        const currentState = LogicModule.getCurrentState();
        const newMessage = { role: 'user', content: messageContent };
        currentState.conversation.push(newMessage);
        
        RenderingModule.renderConversation(currentState.conversation);
        LogicModule.saveConversation();
        userInput.value = '';

        try {
            const assistantMessage = await LogicModule.fetchAzureOpenAIChatCompletion(
                currentState.conversation
            );
            currentState.conversation.push(assistantMessage);
            RenderingModule.renderConversation(currentState.conversation);
            LogicModule.saveConversation();
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while communicating with the Azure OpenAI API. Check the console for details.');
        }
    }

    function openSettingsModal() {
        const config = LogicModule.getConfig();
        document.getElementById('endpoint').value = config.endpoint;
        document.getElementById('deployment').value = config.deployment;
        document.getElementById('api-key').value = config.apiKey;
        document.getElementById('settings-modal').style.display = 'block';
    }

    function closeSettingsModal() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    function saveSettings() {
        const endpoint = document.getElementById('endpoint').value.trim();
        const deployment = document.getElementById('deployment').value.trim();
        const apiKey = document.getElementById('api-key').value.trim();

        if (!endpoint || !deployment || !apiKey) {
            alert('Please fill in all fields.');
            return;
        }

        LogicModule.updateConfig(endpoint, deployment, apiKey);
        alert('Settings saved successfully.');
        closeSettingsModal();
    }

    return {
        setupEventListeners
    };
})();
