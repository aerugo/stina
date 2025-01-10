/**
 * Rendering Module
 * Handles all UI rendering tasks
 */
const RenderingModule = (function() {
    function renderConversation(conversation) {
        const chatHistory = document.getElementById('chat-history');
        chatHistory.innerHTML = '';
        conversation.forEach(message => {
            const messageElem = document.createElement('div');
            messageElem.classList.add('message', message.role);
            const textElem = document.createElement('div');
            textElem.classList.add('text');
            
            if (message.role === 'assistant') {
                // Parse markdown content and sanitize it
                let htmlContent = marked.parse(message.content);
                htmlContent = DOMPurify.sanitize(htmlContent);
                textElem.innerHTML = htmlContent;
            } else {
                // For user messages, display plain text
                textElem.innerText = message.content;
            }
            messageElem.appendChild(textElem);
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
