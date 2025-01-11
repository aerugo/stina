/**
 * Input Module
 * Handles user input and event listeners
 */
const InputModule = (function() {
    function showCustomAlert(message) {
        const modal = document.getElementById('custom-modal');
        const titleElem = document.getElementById('custom-modal-title');
        const bodyElem = document.getElementById('custom-modal-body');
        const footerElem = document.getElementById('custom-modal-footer');

        titleElem.textContent = 'Alert';
        bodyElem.innerHTML = `<p>${message}</p>`;

        footerElem.innerHTML = '';
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        footerElem.appendChild(okButton);

        modal.style.display = 'block';

        const closeButton = document.getElementById('custom-modal-close');
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };
    }

    function showCustomConfirm(message, callback) {
        const modal = document.getElementById('custom-modal');
        const titleElem = document.getElementById('custom-modal-title');
        const bodyElem = document.getElementById('custom-modal-body');
        const footerElem = document.getElementById('custom-modal-footer');

        titleElem.textContent = 'Confirm';
        bodyElem.innerHTML = `<p>${message}</p>`;

        footerElem.innerHTML = '';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            modal.style.display = 'none';
            callback(false);
        });

        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.addEventListener('click', () => {
            modal.style.display = 'none';
            callback(true);
        });

        footerElem.appendChild(cancelButton);
        footerElem.appendChild(okButton);

        modal.style.display = 'block';

        const closeButton = document.getElementById('custom-modal-close');
        closeButton.onclick = () => {
            modal.style.display = 'none';
            callback(false);
        };
    }

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
                    showCustomAlert('Chat not found.');
                }
            } else if (deleteBtn) {
                const chat = LogicModule.getCurrentState().chats.find(c => c.id === chatId);
                showCustomConfirm(
                    `Are you sure you want to delete "${chat.name}"? This action cannot be undone.`,
                    function(confirmDelete) {
                        if (confirmDelete) {
                            const state = LogicModule.deleteChat(chatId);
                            RenderingModule.renderChatList(state.chats, state.currentChatId);
                            RenderingModule.renderConversation(state.conversation);
                        }
                    }
                );
            }
        });

        window.addEventListener('click', (event) => {
            if (event.target === settingsModal) {
                closeSettingsModal();
            }
            const customModal = document.getElementById('custom-modal');
            if (event.target === customModal) {
                customModal.style.display = 'none';
            }
        });

        // Initialize theme on page load
        const storedTheme = LogicModule.getConfig().theme || 'light-mode';
        applyTheme(storedTheme);
    }

    async function sendMessage() {
        const userInput = document.getElementById('user-input');
        const messageContent = userInput.value.trim();
        if (messageContent === '') return;

        const config = LogicModule.getConfig();
        if (!config.endpoint || !config.deployment || !config.apiKey) {
            showCustomAlert('Please set your configuration in the settings before sending messages.');
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

            // Check if the chat title needs updating
            const chat = LogicModule.getCurrentChat();
            if (chat.name === 'New chat') {
                // Generate a title based on the first user message
                const title = await LogicModule.generateChatTitle(currentState.conversation[0].content);
                LogicModule.updateChatTitle(chat.id, title);
                RenderingModule.renderChatList(LogicModule.getCurrentState().chats, currentState.currentChatId);
            }
        } catch (error) {
            console.error('Error:', error);
            showCustomAlert('An error occurred while communicating with the Azure OpenAI API. Check the console for details.');
        }
    }

    function openSettingsModal() {
        const config = LogicModule.getConfig();
        document.getElementById('endpoint').value = config.endpoint;
        document.getElementById('deployment').value = config.deployment;
        document.getElementById('api-key').value = config.apiKey;
        document.getElementById('title-deployment').value = config.titleDeployment || '';
        // Set the theme radio button based on the current theme
        const themeRadios = document.getElementsByName('theme');
        themeRadios.forEach(radio => {
            radio.checked = (radio.value === (config.theme || 'light-mode'));
        });
        document.getElementById('settings-modal').style.display = 'block';
    }

    function applyTheme(theme) {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(theme);
    }

    function closeSettingsModal() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    function saveSettings() {
        const endpoint = document.getElementById('endpoint').value.trim();
        const deployment = document.getElementById('deployment').value.trim();
        const apiKey = document.getElementById('api-key').value.trim();
        const titleDeployment = document.getElementById('title-deployment').value.trim();
        // Retrieve the selected theme from the radio buttons
        let theme = 'light-mode'; // Default theme
        const themeRadios = document.getElementsByName('theme');
        themeRadios.forEach(radio => {
            if (radio.checked) {
                theme = radio.value;
            }
        });

        if (!endpoint || !deployment || !apiKey) {
            showCustomAlert('Please fill in all fields.');
            return;
        }

        LogicModule.updateConfig(endpoint, deployment, apiKey, theme, titleDeployment);
        applyTheme(theme);
        showCustomAlert('Settings saved successfully.');
        closeSettingsModal();
    }

    return {
        setupEventListeners
    };
})();
