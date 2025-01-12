/**
 * Rendering Module
 * Handles all UI rendering tasks
 */
// Configure marked parser to enable line breaks globally
marked.setOptions({ breaks: true });

var RenderingModule = (function() {
    const models = ModelsModule.getModels(); // Retrieve models

    function createMessageElement(message) {
        const messageElem = document.createElement('div');
        messageElem.classList.add(message.role === 'assistant' ? 'assistant-message' : 'user-message');

        if (message.role === 'assistant') {
            if (message.isLoading) {
                messageElem.innerHTML = `
                    <progress class="progress is-small is-primary" max="100">
                        Loading
                    </progress>
                `;
            } else {
                let htmlContent = marked.parse(message.content);
                htmlContent = DOMPurify.sanitize(htmlContent);

                // Create container for assistant message
                const assistantMessageContainer = document.createElement('div');
                assistantMessageContainer.classList.add('assistant-message-container');

                // Create content element
                const articleElem = document.createElement('article');
                articleElem.classList.add('assistant-article');
                articleElem.innerHTML = htmlContent;

                // Create footer for copy button and model/instruction label
                const messageFooter = document.createElement('div');
                messageFooter.classList.add('message-footer');

                // Create the copy button
                const copyButton = document.createElement('button');
                copyButton.classList.add('button', 'is-small', 'copy-button');
                copyButton.innerHTML = `
                    <span class="icon is-small"><i class="fas fa-copy"></i></span>
                    <span>Copy</span>
                `;

                // Add event listener to copy button
                copyButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(message.content).then(() => {
                        copyButton.innerHTML = 'Copied!';
                        setTimeout(() => {
                            copyButton.innerHTML = `
                                <span class="icon is-small"><i class="fas fa-copy"></i></span>
                                <span>Copy</span>
                            `;
                        }, 2000);
                    }).catch(err => {
                        console.error('Could not copy text: ', err);
                    });
                });

                // Create the model/instruction label
                const modelInstructionLabel = document.createElement('span');
                modelInstructionLabel.classList.add('model-instruction-label');

                // Format the label
                let labelText = `${message.model || 'N/A'}`;
                if (message.instructionLabel) {
                    labelText += ` with ${message.instructionLabel}`;
                }
                modelInstructionLabel.textContent = labelText;

                // Append copy button and model/instruction label to the footer
                messageFooter.appendChild(copyButton);
                messageFooter.appendChild(modelInstructionLabel);

                // Assemble the assistant message container
                assistantMessageContainer.appendChild(articleElem);
                assistantMessageContainer.appendChild(messageFooter);

                // Append the container to the message element
                messageElem.appendChild(assistantMessageContainer);
            }
        } else {
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('user-message-content');
            contentDiv.innerText = message.content;

            messageElem.appendChild(contentDiv);
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
        chatHistory.scrollTo({
          top: chatHistory.scrollHeight,
          behavior: 'smooth'
        });
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
