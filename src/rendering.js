/**
 * Rendering Module
 * Handles all UI rendering tasks
 */
// Configure marked parser to enable line breaks globally
marked.setOptions({ breaks: true });

var RenderingModule = (function() {
    const models = ModelsModule.getModels(); // Retrieve models

    function createMessageElement(message) {
        const messageElem = document.createElement('article');
        messageElem.classList.add('media', message.role);
        const mediaContent = document.createElement('div');
        mediaContent.classList.add('media-content');
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
    
        if (message.role === 'assistant') {
            if (message.isLoading) {
                contentDiv.innerHTML = `
                    <progress class="progress is-small is-primary" max="100">
                        Loading
                    </progress>
                `;
            } else {
                let htmlContent = marked.parse(message.content);
                htmlContent = DOMPurify.sanitize(htmlContent);
                contentDiv.innerHTML = htmlContent;

                const levelDiv = document.createElement('nav');
                levelDiv.classList.add('level', 'is-mobile');

                const leftLevelItem = document.createElement('div');
                leftLevelItem.classList.add('level-left');

                const rightLevelItem = document.createElement('div');
                rightLevelItem.classList.add('level-right');

                // Copy button
                const copyButton = document.createElement('button');
                copyButton.classList.add('button', 'is-small');
                
                // Model label
                const modelLabel = document.createElement('span');
                modelLabel.classList.add('tag', 'is-light');
                const models = ModelsModule.getModels();
                let modelLabelText = models[message.model]?.label || message.model || 'Unknown Model';
                if (models[message.model]?.system && message.instructionLabel) {
                    modelLabelText += ' with ' + message.instructionLabel;
                }
                modelLabel.textContent = modelLabelText;
                copyButton.innerHTML = `
                    <span class="icon is-small">
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19,21H5C3.9,21 3,20.1 3,19V7H5V19H19V21ZM21,5H8C6.9,5 6,5.9 6,7V17C6,18.1 6.9,19 8,19H21C22.1,19 23,18.1 23,17V7C23,5.9 22.1,5 21,5M21,17H8V7H21V17Z" />
                        </svg>
                    </span>
                    <span>Copy</span>
                `;

                copyButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(message.content)
                        .then(() => {
                            copyButton.innerHTML = `
                                <span class="icon is-small">
                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41-1.41L9,16.17z" />
                                    </svg>
                                </span>
                                <span>Copied!</span>
                            `;
                            setTimeout(() => {
                                copyButton.innerHTML = `
                                    <span class="icon is-small">
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M19,21H5C3.9,21 3,20.1 3,19V7H5V19H19V21ZM21,5H8C6.9,5 6,5.9 6,7V17C6,18.1 6.9,19 8,19H21C22.1,19 23,18.1 23,17V7C23,5.9 22.1,5 21,5M21,17H8V7H21V17Z" />
                                        </svg>
                                    </span>
                                    <span>Copy</span>
                                `;
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy text: ', err);
                        });
                });

                leftLevelItem.appendChild(copyButton);
                rightLevelItem.appendChild(modelLabel);
                levelDiv.appendChild(leftLevelItem);
                levelDiv.appendChild(rightLevelItem);
                mediaContent.appendChild(contentDiv);
                mediaContent.appendChild(levelDiv);
            }
        } else {
            // For user messages, display plain text
            contentDiv.innerText = message.content;
            mediaContent.appendChild(contentDiv);
        }
        
        messageElem.appendChild(mediaContent);
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
