// Frontend JavaScript Code  
  
// DOM Elements  
const chatHistory = document.getElementById('chat-history');  
const userInput = document.getElementById('user-input');  
const sendBtn = document.getElementById('send-btn');  
const newChatBtn = document.getElementById('new-chat-btn');  
const settingsBtn = document.getElementById('settings-btn');  
const settingsModal = document.getElementById('settings-modal');  
const closeSettings = document.getElementById('close-settings');  
const saveSettingsBtn = document.getElementById('save-settings-btn');  
const endpointInput = document.getElementById('endpoint');  
const deploymentInput = document.getElementById('deployment');  
const apiKeyInput = document.getElementById('api-key');  
const chatList = document.getElementById('chat-list');  
  
// Global Variables  
let chats = JSON.parse(localStorage.getItem('chats')) || [];  
let currentChatId = localStorage.getItem('currentChatId');  
let conversation = []; // Initialize the conversation variable  
  
// Initialization  
if (chats.length === 0) {  
    // No chats exist, create a new one  
    createNewChat();  
} else if (currentChatId) {  
    // Load the current chat  
    loadChat(currentChatId);  
} else {  
    // Load the first chat  
    loadChat(chats[0].id);  
}  
  
// Function to create a new chat  
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
    renderChatList();  
    renderConversation();  
}  
  
// Function to load a chat by ID  
function loadChat(chatId) {  
    currentChatId = chatId;  
    const chat = chats.find(c => c.id === chatId);  
    if (chat) {  
        conversation = chat.conversation;  
        renderConversation();  
        renderChatList();  
        saveCurrentChatId();  
    } else {  
        alert('Chat not found.');  
    }  
}  
  
// Function to render the conversation  
function renderConversation() {  
    chatHistory.innerHTML = '';  
    conversation.forEach(message => {  
        const messageElem = document.createElement('div');  
        messageElem.classList.add('message', message.role);  
        const textElem = document.createElement('div');  
        textElem.classList.add('text');  
        textElem.innerText = message.content;  
        messageElem.appendChild(textElem);  
        chatHistory.appendChild(messageElem);  
    });  
    chatHistory.scrollTop = chatHistory.scrollHeight;  
}  
  
// Function to render the chat list  
function renderChatList() {  
    chatList.innerHTML = '';  
    chats.forEach(chat => {  
        const chatItem = document.createElement('li');  
        chatItem.dataset.chatId = chat.id;  
        if (chat.id === currentChatId) {  
            chatItem.classList.add('active');  
        }  
  
        // Chat name span  
        const chatName = document.createElement('span');  
        chatName.classList.add('chat-name');  
        chatName.innerText = chat.name;  
  
        // Event listener to load chat when name is clicked  
        chatName.addEventListener('click', () => {  
            loadChat(chat.id);  
        });  
  
        // Delete button  
        const deleteBtn = document.createElement('button');  
        deleteBtn.classList.add('delete-chat-btn');  
        deleteBtn.innerText = '×';  
  
        // Event listener to delete chat when delete button is clicked  
        deleteBtn.addEventListener('click', (event) => {  
            event.stopPropagation(); // Prevent click event from bubbling up  
            const confirmDelete = confirm(`Are you sure you want to delete "${chat.name}"? This action cannot be undone.`);  
            if (confirmDelete) {  
                deleteChat(chat.id);  
            }  
        });  
  
        // Append elements  
        chatItem.appendChild(chatName);  
        chatItem.appendChild(deleteBtn);  
        chatList.appendChild(chatItem);  
    });  
}  
  
// Function to delete a chat  
function deleteChat(chatId) {  
    // Remove the chat from the chats array  
    chats = chats.filter(chat => chat.id !== chatId);  
  
    // If the deleted chat is the current chat  
    if (currentChatId === chatId) {  
        if (chats.length > 0) {  
            // Load the first chat  
            loadChat(chats[0].id);  
        } else {  
            // No chats left, create a new chat  
            createNewChat();  
        }  
    } else {  
        // Save the changes and re-render the chat list  
        saveChats();  
        renderChatList();  
    }  
}  
  
// Function to save chats to localStorage  
function saveChats() {  
    localStorage.setItem('chats', JSON.stringify(chats));  
}  
  
// Function to save current chat ID to localStorage  
function saveCurrentChatId() {  
    localStorage.setItem('currentChatId', currentChatId);  
}  
  
// Function to save conversations  
function saveConversation() {  
    const chat = chats.find(c => c.id === currentChatId);  
    if (chat) {  
        chat.conversation = conversation;  
        saveChats();  
    }  
}  
  
// Load configuration from localStorage  
let endpoint = localStorage.getItem('endpoint') || '';  
let deployment = localStorage.getItem('deployment') || '';  
let apiKey = localStorage.getItem('apiKey') || '';  
  
// Function to handle sending a message  
function sendMessage() {  
    const messageContent = userInput.value.trim();  
    if (messageContent === '') return;  
  
    // Check if configuration is set  
    if (!endpoint || !deployment || !apiKey) {  
        alert('Please set your configuration in the settings before sending messages.');  
        return;  
    }  
  
    // Add user's message to the conversation  
    const userMessage = { role: 'user', content: messageContent };  
    conversation.push(userMessage);  
    renderConversation();  
    saveConversation();  
    userInput.value = '';  
  
    // Send the message to the Azure OpenAI API  
    fetchAzureOpenAIChatCompletion();  
}  
  
// Function to fetch chat completion from Azure OpenAI API  
function fetchAzureOpenAIChatCompletion() {    
    // Prepare the request payload  
    const body = {  
        messages: conversation,  
        max_tokens: 800,  
        temperature: 0.7,  
        top_p: 0.95,  
        frequency_penalty: 0,  
        presence_penalty: 0,  
        stop: null,  
        stream: false // Set to true if you want to handle streaming  
    };  
  
    // Send the POST request to the Azure OpenAI API  
    fetch(endpoint, {  
        method: 'POST',  
        headers: {  
            'Content-Type': 'application/json',  
            'api-key': apiKey  
        },  
        body: JSON.stringify(body)  
    })  
    .then(response => {  
        if (!response.ok) {  
            return response.text().then(text => { throw new Error(text) });  
        }  
        return response.json();  
    })  
    .then(data => {  
        const assistantMessage = data.choices[0].message;  
        conversation.push(assistantMessage);  
        renderConversation();  
        saveConversation();  
    })  
    .catch(error => {  
        console.error('Error:', error);  
        alert('An error occurred while communicating with the Azure OpenAI API. Check the console for details.');  
    });  
}  
  
// Function to open the settings modal  
function openSettingsModal() {  
    // Populate inputs with existing values  
    endpointInput.value = endpoint;  
    deploymentInput.value = deployment;  
    apiKeyInput.value = apiKey;  
    settingsModal.style.display = 'block';  
}  
  
// Function to close the settings modal  
function closeSettingsModal() {  
    settingsModal.style.display = 'none';  
}  
  
// Function to save settings  
function saveSettings() {  
    endpoint = endpointInput.value.trim();  
    deployment = deploymentInput.value.trim();  
    apiKey = apiKeyInput.value.trim();  
  
    if (!endpoint || !deployment || !apiKey) {  
        alert('Please fill in all fields.');  
        return;  
    }  
  
    // Save to localStorage  
    localStorage.setItem('endpoint', endpoint);  
    localStorage.setItem('deployment', deployment);  
    localStorage.setItem('apiKey', apiKey);  
  
    alert('Settings saved successfully.');  
    closeSettingsModal();  
}  
  
// Event listeners  
sendBtn.addEventListener('click', sendMessage);  
  
userInput.addEventListener('keydown', (e) => {  
    if (e.key === 'Enter' && !e.shiftKey) {  
        e.preventDefault();  
        sendMessage();  
    }  
});  
  
newChatBtn.addEventListener('click', () => {  
    createNewChat();  
});  
  
settingsBtn.addEventListener('click', openSettingsModal);  
closeSettings.addEventListener('click', closeSettingsModal);  
saveSettingsBtn.addEventListener('click', saveSettings);  
  
// Close the modal if the user clicks outside of it  
window.addEventListener('click', (event) => {  
    if (event.target === settingsModal) {  
        closeSettingsModal();  
    }  
});  
  
// Initial render  
renderChatList();  
renderConversation(); // Ensure the initial conversation is rendered  