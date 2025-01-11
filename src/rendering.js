/**
 * Rendering Module
 * Handles all UI rendering tasks
 */
// Configure marked parser to enable line breaks globally
marked.setOptions({ breaks: true });

const RenderingModule = (function() {
    function createMessageElement(message) {
        const messageElem = document.createElement('div');
        messageElem.classList.add('message', message.role);
        const textElem = document.createElement('div');
        textElem.classList.add('text');
    
        let actionContainer = null;

        if (message.role === 'assistant') {
            if (message.isLoading) {
                // Display loading animation
                textElem.innerHTML = '<div class="loading-spinner"></div>';
            } else {
                // Parse markdown content and sanitize it
                let htmlContent = marked.parse(message.content);
                htmlContent = DOMPurify.sanitize(htmlContent);
                textElem.innerHTML = htmlContent;

                // Create a container for the copy button and model label
                actionContainer = document.createElement('div');
                actionContainer.classList.add('action-container');
                actionContainer.style.width = '100%';

                // Create copy button with SVG icon
                const copyButton = document.createElement('button');
                copyButton.classList.add('copy-button');

                // Create model label element
                const modelLabel = document.createElement('span');
                modelLabel.classList.add('model-label');
                // Determine the model label text
                let modelLabelText = models[message.model]?.label || message.model || 'Unknown Model';
                if (models[message.model]?.system && message.instructionLabel) {
                    modelLabelText += ' with ' + message.instructionLabel;
                }
                modelLabel.textContent = modelLabelText;
                copyButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19,21H5C3.9,21 3,20.1 3,19V7H5V19H19V21ZM21,5H8C6.9,5 6,5.9 6,7V17C6,18.1 6.9,19 8,19H21C22.1,19 23,18.1 23,17V7C23,5.9 22.1,5 21,5M21,17H8V7H21V17Z" />
                    </svg>
                `;

                // Add click event listener to copy the raw markdown content
                copyButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(message.content)
                        .then(() => {
                            copyButton.innerHTML = 'Copied!';
                            setTimeout(() => {
                                copyButton.innerHTML = `
                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M19,21H5C3.9,21 3,20.1 3,19V7H5V19H19V21ZM21,5H8C6.9,5 6,5.9 6,7V17C6,18.1 6.9,19 8,19H21C22.1,19 23,18.1 23,17V7C23,5.9 22.1,5 21,5M21,17H8V7H21V17Z" />
                                    </svg>
                                `;
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy text: ', err);
                        });
                });

                // Append copy button and model label to the action container
                actionContainer.appendChild(copyButton);
                actionContainer.appendChild(modelLabel);
            }
        } else {
            // For user messages, display plain text
            textElem.innerText = message.content;
        }

        messageElem.appendChild(textElem);
        if (actionContainer) {
            messageElem.appendChild(actionContainer);
        }
        return messageElem;
    }

    function renderConversation(conversation) {
        const chatHistory = document.getElementById('chat-history');
        chatHistory.innerHTML = '';
        conversation.forEach(message => {
            const messageElem = createMessageElement(message);
            chatHistory.appendChild(messageElem);
        });
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function renderChatList(chats, currentChatId) {
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';
        chats.forEach(chat => {
            const chatItem = document.createElement('li');
            chatItem.dataset.chatId = chat.id;
            if (chat.id === currentChatId) {
                chatItem.classList.add('active');
            }

            const chatName = document.createElement('span');
            chatName.classList.add('chat-name');
            chatName.innerText = chat.name;

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-chat-btn');
            deleteBtn.innerText = '×';

            chatItem.appendChild(chatName);
            chatItem.appendChild(deleteBtn);
            chatList.appendChild(chatItem);
        });
    }

    return {
        renderConversation,
        renderChatList
    };
})();
