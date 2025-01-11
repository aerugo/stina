/**
 * Event Module
 * Handles event listeners and event-related functions.
 */
var EventModule = (function() {
    function setupEventListeners() {
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const newChatBtn = document.getElementById('new-chat-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettings = document.getElementById('close-settings');
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        const chatList = document.getElementById('chat-list');

        sendBtn.addEventListener('click', handleSendButtonClick);
        userInput.addEventListener('keydown', handleUserInputKeyDown);
        newChatBtn.addEventListener('click', handleNewChatClick);
        settingsBtn.addEventListener('click', openSettingsModal);
        closeSettings.addEventListener('click', closeSettingsModal);
        saveSettingsBtn.addEventListener('click', saveSettings);
        chatList.addEventListener('click', handleChatListClick);
        window.addEventListener('click', handleWindowClick);

        // Initialize theme on page load
        const storedTheme = LogicModule.getConfig().theme || 'light-mode';
        ThemeModule.applyTheme(storedTheme);
    }

    function handleSendButtonClick() {
        const userInput = document.getElementById('user-input');
        const messageContent = userInput.value.trim();
        if (messageContent === '') return;

        const config = LogicModule.getConfig();
        if (!config.endpoint || !config.apiKey) {
            InputModule.showCustomAlert('Please set your configuration in the settings before sending messages.');
            return;
        }

        ControllerModule.sendMessage(messageContent);
        userInput.value = '';
    }

    function handleUserInputKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendButtonClick();
        }
    }

    function handleNewChatClick() {
        const state = ChatModule.createNewChat();
        RenderingModule.renderChatList(state.chats, state.currentChatId);
        RenderingModule.renderConversation(state.conversation);
    }

    function handleChatListClick(e) {
        const chatName = e.target.closest('.chat-name');
        const deleteBtn = e.target.closest('.delete-chat-btn');
        const chatItem = e.target.closest('li');

        if (!chatItem) return;

        const chatId = chatItem.dataset.chatId;

        if (chatName) {
            const result = ChatModule.loadChat(chatId);
            if (result.success) {
                RenderingModule.renderChatList(
                    ChatModule.getCurrentState().chats,
                    result.currentChatId
                );
                RenderingModule.renderConversation(result.conversation);
            } else {
                InputModule.showCustomAlert('Chat not found.');
            }
        } else if (deleteBtn) {
            const chat = ChatModule.getCurrentState().chats.find(c => c.id === chatId);
            InputModule.showCustomConfirm(
                `Are you sure you want to delete "${chat.name}"? This action cannot be undone.`,
                function(confirmDelete) {
                    if (confirmDelete) {
                        const state = ChatModule.deleteChat(chatId);
                        RenderingModule.renderChatList(state.chats, state.currentChatId);
                        RenderingModule.renderConversation(state.conversation);
                    }
                }
            );
        }
    }

    function handleWindowClick(event) {
        if (event.target === document.getElementById('settings-modal')) {
            closeSettingsModal();
        }
        if (event.target === document.getElementById('custom-modal')) {
            document.getElementById('custom-modal').style.display = 'none';
        }
    }

    function openSettingsModal() {
        const config = ConfigModule.getConfig();
        document.getElementById('endpoint').value = config.endpoint;
        document.getElementById('api-key').value = config.apiKey;
        document.getElementById('title-deployment').value = config.titleDeployment || '';
        document.getElementById('settings-modal').style.display = 'block';
    }

    function closeSettingsModal() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    function saveSettings() {
        const endpoint = document.getElementById('endpoint').value.trim();
        const apiKey = document.getElementById('api-key').value.trim();
        const titleDeployment = document.getElementById('title-deployment').value.trim();
        const theme = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';

        if (!endpoint || !apiKey) {
            InputModule.showCustomAlert('Please fill in all required fields.');
            return;
        }

        ConfigModule.updateConfig({
            endpoint,
            apiKey,
            theme,
            titleDeployment
        });
        
        InputModule.showCustomAlert('Settings saved successfully.');
        closeSettingsModal();
    }

    return {
        setupEventListeners,
        handleSendButtonClick,
        handleUserInputKeyDown,
        handleNewChatClick,
        handleChatListClick,
        handleWindowClick,
        openSettingsModal,
        closeSettingsModal,
        saveSettings
    };
})();
