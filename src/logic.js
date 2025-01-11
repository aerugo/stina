/**
 * Logic Module
 * Handles application logic such as chat and conversation management.
 */
var LogicModule = (function () {
  // Private variables
  let chats = StorageModule.loadData("chats") || [];
  let currentChatId = StorageModule.loadData("currentChatId");
  let conversation = [];

  function createNewChat() {
    const chatId = Date.now().toString();
    const chat = {
      id: chatId,
      name: "New chat",
      conversation: [],
    };
    chats.push(chat);
    currentChatId = chatId;
    conversation = chat.conversation;
    saveChats();
    saveCurrentChatId();
    return {
      chats,
      currentChatId,
      conversation,
    };
  }

  function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      conversation = chat.conversation;
      saveCurrentChatId();
      return {
        chats,
        conversation,
        currentChatId,
        success: true,
      };
    }
    return { success: false };
  }

  function saveChats() {
    localStorage.setItem("chats", JSON.stringify(chats));
  }

  function saveCurrentChatId() {
    localStorage.setItem("currentChatId", currentChatId);
  }

  function saveConversation() {
    const chat = chats.find((c) => c.id === currentChatId);
    if (chat) {
      chat.conversation = conversation;
      saveChats();
    }
  }

  function deleteChat(chatId) {
    chats = chats.filter((chat) => chat.id !== chatId);
    if (currentChatId === chatId) {
      if (chats.length > 0) {
        return loadChat(chats[0].id);
      } else {
        return createNewChat();
      }
    }
    saveChats();
    return {
      chats,
      currentChatId,
      conversation,
    };
  }


  function getCurrentChat() {
    return chats.find((c) => c.id === currentChatId);
  }

  async function generateChatTitle(userMessage) {
    const prompt = `Provide a short (maximum 5 words) and descriptive chat title based on the following message:\n"${userMessage}"`;
    const titleMessage = { role: "user", content: prompt };
    const response = await fetchAzureOpenAIChatCompletion(
      [titleMessage],
      titleDeployment
    );
    return response.content.trim().replace(/[\n\r]/g, "");
  }

  function updateChatTitle(chatId, newTitle) {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      chat.name = newTitle || "New chat";
      saveChats();
    }
  }

  async function fetchAzureOpenAIChatCompletion(
    messages,
    customDeployment = ""
  ) {
    const modelParams = models[selectedModelKey];
    if (!modelParams) {
      throw new Error(`Model ${selectedModelKey} not found.`);
    }

    const deploymentToUse = customDeployment || modelParams.deployment;
    const url = `${endpoint}/openai/deployments/${deploymentToUse}/chat/completions?api-version=${apiVersion}`;

    const preparedMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const { label, deployment, system, context_length, ...apiParams } =
      modelParams;
    const body = {
      ...apiParams,
      messages: preparedMessages,
    };

    // Log the API request details
    console.log("Submitting API Request:", {
      url,
      body: JSON.stringify(body, null, 2)
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    return data.choices[0].message;
  }

  function getCurrentState() {
    return {
      chats,
      currentChatId,
      conversation,
    };
  }

  return {
    createNewChat,
    loadChat,
    deleteChat,
    getCurrentChat,
    generateChatTitle,
    updateChatTitle,
    fetchAzureOpenAIChatCompletion,
    getCurrentState,
    saveConversation,
    updateSelectedModel: function (newModelKey) {
      ConfigModule.updateConfig({ selectedModelKey: newModelKey });
    },
  };
})();
