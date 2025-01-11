/**
 * Input Module
 * Handles user input and event listeners
 */
const InputModule = (function() {
    function showCustomModal(title, message, buttons, callback) {
        const modal = document.getElementById('custom-modal');
        const titleElem = document.getElementById('custom-modal-title');
        const bodyElem = document.getElementById('custom-modal-body');
        const footerElem = document.getElementById('custom-modal-footer');

        titleElem.textContent = title;
        bodyElem.innerHTML = `<p>${message}</p>`;

        footerElem.innerHTML = '';
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.label;
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
                if (callback) callback(button.value);
            });
            footerElem.appendChild(btn);
        });

        modal.style.display = 'block';

        const closeButton = document.getElementById('custom-modal-close');
        closeButton.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback(null);
        };
    }

    function showCustomAlert(message) {
        showCustomModal('Alert', message, [{ label: 'OK', value: true }]);
    }

    function showCustomConfirm(message, callback) {
        const buttons = [
            { label: 'Cancel', value: false },
            { label: 'OK', value: true }
        ];
        showCustomModal('Confirm', message, buttons, callback);
    }

    function handleSendButtonClick() {
        sendMessage();
    }

    function handleUserInputKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function handleNewChatClick() {
        const state = LogicModule.createNewChat();
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
    }

    function handleWindowClick(event) {
        if (event.target === document.getElementById('settings-modal')) {
            closeSettingsModal();
        }
        if (event.target === document.getElementById('custom-modal')) {
            document.getElementById('custom-modal').style.display = 'none';
        }
    }

    let selectedModelKey = LogicModule.getConfig().selectedModelKey || 'gpt-4o-3';

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

        // Populate the model selector
        const modelSelect = document.getElementById('model-select');
        for (const key in models) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = models[key].label;
            modelSelect.appendChild(option);
        }

        // Load custom instructions from localStorage
        let customInstructions = JSON.parse(localStorage.getItem('customInstructions')) || [];

        function saveCustomInstruction(instruction) {
            customInstructions.push(instruction);
            localStorage.setItem('customInstructions', JSON.stringify(customInstructions));
        }

        function addInstructionOption(instruction) {
            const option = document.createElement('option');
            option.value = instruction.id;
            option.textContent = instruction.label;
            instructionsSelect.insertBefore(option, instructionsSelect.lastChild);
        }

        // Populate the instructions selector
        const instructionsSelect = document.getElementById('instructions-select');
        
        // Add default instructions
        instructions.forEach((instruction) => {
            const option = document.createElement('option');
            option.value = instruction.id;
            option.textContent = instruction.label;
            instructionsSelect.appendChild(option);
        });

        // Add custom instructions
        customInstructions.forEach((instruction) => {
            addInstructionOption(instruction);
        });

        // Add the option for creating a new instruction
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = 'Create New Instruction...';
        instructionsSelect.appendChild(customOption);

        // Set the selected model based on the config
        modelSelect.value = selectedModelKey;

        // Handle visibility of Instructions selector based on selected model
        function updateInstructionsVisibility() {
            const selectedModelParams = models[selectedModelKey];
            const instructionsGroup = document.getElementById('instructions-group');
            if (selectedModelParams.system) {
                instructionsGroup.style.display = 'flex';
            } else {
                instructionsGroup.style.display = 'none';
            }
        }

        // Update selected model when changed
        modelSelect.addEventListener('change', function() {
            selectedModelKey = this.value;
            LogicModule.updateSelectedModel(selectedModelKey);
            updateInstructionsVisibility();
        });

        // Handle creation of new instruction
        instructionsSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                showInstructionCreationModal((newInstruction) => {
                    if (newInstruction) {
                        saveCustomInstruction(newInstruction);
                        addInstructionOption(newInstruction);
                        instructionsSelect.value = newInstruction.id;
                    } else {
                        instructionsSelect.value = instructions[0].id;
                    }
                });
            }
        });

        function showInstructionCreationModal(callback) {
            const modal = document.getElementById('custom-modal');
            const titleElem = document.getElementById('custom-modal-title');
            const bodyElem = document.getElementById('custom-modal-body');
            const footerElem = document.getElementById('custom-modal-footer');

            titleElem.textContent = 'Create Custom Instruction';
            bodyElem.innerHTML = `
                <div class="input-group">
                    <label for="instruction-title">Title:</label>
                    <input type="text" id="instruction-title" style="width: 100%; padding: 10px; margin-bottom: 10px;" placeholder="Enter instruction title">
                </div>
                <div class="input-group">
                    <label for="instruction-content">Content:</label>
                    <textarea id="instruction-content" rows="5" style="width: 100%; padding: 10px;" placeholder="Enter instruction content"></textarea>
                </div>
            `;

            footerElem.innerHTML = '';

            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                modal.style.display = 'none';
                if (callback) callback(null);
            });

            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.addEventListener('click', () => {
                const title = document.getElementById('instruction-title').value.trim();
                const content = document.getElementById('instruction-content').value.trim();
                if (title && content) {
                    const newInstruction = {
                        id: 'custom_' + Date.now(),
                        label: title,
                        content: content,
                    };
                    modal.style.display = 'none';
                    if (callback) callback(newInstruction);
                } else {
                    showCustomAlert('Please provide both a title and content for the instruction.');
                }
            });

            footerElem.appendChild(cancelButton);
            footerElem.appendChild(saveButton);

            modal.style.display = 'block';
            document.getElementById('instruction-title').focus();
        }

        // Initialize instructions visibility
        updateInstructionsVisibility();

        // Initialize theme on page load
        const storedTheme = LogicModule.getConfig().theme || 'light-mode';
        applyTheme(storedTheme);
    }

    async function sendMessage() {
        const userInput = document.getElementById('user-input');
        const messageContent = userInput.value.trim();
        if (messageContent === '') return;

        const config = LogicModule.getConfig();
        if (!config.endpoint || !config.apiKey) {
            showCustomAlert('Please set your configuration in the settings before sending messages.');
            return;
        }

        const currentState = LogicModule.getCurrentState();
        const newMessage = { role: 'user', content: messageContent };
        currentState.conversation.push(newMessage);
        
        RenderingModule.renderConversation(currentState.conversation);
        LogicModule.saveConversation();
        userInput.value = '';

        // Add a placeholder assistant message with a loading indicator
        const loadingMessage = { role: 'assistant', content: '', isLoading: true };
        currentState.conversation.push(loadingMessage);
        RenderingModule.renderConversation(currentState.conversation);

        // Store the index of the loading message to replace it later
        const loadingMessageIndex = currentState.conversation.length - 1;

        try {
            let conversationToSend = [...currentState.conversation];

            // Include system message if applicable
            const selectedModelParams = models[selectedModelKey];
            if (selectedModelParams.system) {
                const instructionsSelect = document.getElementById('instructions-select');
                let systemContent = '';
                const selectedInstructionId = instructionsSelect.value;

                // Check custom instructions first
                const customInstruction = customInstructions.find(instr => instr.id === selectedInstructionId);
                if (customInstruction) {
                    systemContent = customInstruction.content;
                } else {
                    // Check default instructions
                    const defaultInstruction = instructions.find(instr => instr.id === selectedInstructionId);
                    if (defaultInstruction) {
                        systemContent = defaultInstruction.content;
                    }
                }

                if (systemContent) {
                    // Prepend system message
                    conversationToSend = [{ role: 'system', content: systemContent }, ...conversationToSend];
                }
            }

            const assistantMessage = await LogicModule.fetchAzureOpenAIChatCompletion(
                conversationToSend
            );
            // Add the model key to the assistantMessage
            assistantMessage.model = selectedModelKey;
            // Replace the loading message with the actual assistant message
            currentState.conversation[loadingMessageIndex] = assistantMessage;
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
            // Remove the loading message
            currentState.conversation.splice(loadingMessageIndex, 1);
            RenderingModule.renderConversation(currentState.conversation);
            console.error('Error:', error);
            showCustomAlert('An error occurred while communicating with the Azure OpenAI API. Check the console for details.');
        }
    }

    function openSettingsModal() {
        const config = LogicModule.getConfig();
        document.getElementById('endpoint').value = config.endpoint;
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

        if (!endpoint || !apiKey) {
            showCustomAlert('Please fill in all fields.');
            return;
        }

        LogicModule.updateConfig(endpoint, apiKey, theme, titleDeployment, selectedModelKey);
        applyTheme(theme);
        showCustomAlert('Settings saved successfully.');
        closeSettingsModal();
    }

    function showInputModal(title, message, defaultValue, callback) {
        const modal = document.getElementById('custom-modal');
        const titleElem = document.getElementById('custom-modal-title');
        const bodyElem = document.getElementById('custom-modal-body');
        const footerElem = document.getElementById('custom-modal-footer');

        titleElem.textContent = title;

        bodyElem.innerHTML = `
            <p>${message}</p>
            <input type="text" id="modal-input" style="width: 100%; padding: 10px; margin-top: 10px;" value="${defaultValue}">
        `;

        footerElem.innerHTML = '';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            modal.style.display = 'none';
            if (callback) callback(null);
        });

        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.addEventListener('click', () => {
            const inputValue = document.getElementById('modal-input').value;
            modal.style.display = 'none';
            if (callback) callback(inputValue.trim() !== '' ? inputValue : null);
        });

        footerElem.appendChild(cancelButton);
        footerElem.appendChild(okButton);

        modal.style.display = 'block';

        // Set focus to the input field
        const inputField = document.getElementById('modal-input');
        inputField.focus();

        // Handle Enter key to submit
        inputField.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                okButton.click();
            }
        });

        // Close modal when clicking the close button
        const closeButton = document.getElementById('custom-modal-close');
        closeButton.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback(null);
        };
    }

    return {
        setupEventListeners
    };
})();
