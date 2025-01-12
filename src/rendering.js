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

                const articleElem = document.createElement('article');
                articleElem.classList.add('assistant-article');
                articleElem.innerHTML = htmlContent;

                messageElem.appendChild(articleElem);
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
