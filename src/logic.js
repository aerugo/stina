/**
 * Logic Module
 * Handles application logic such as chat and conversation management.
 */
var LogicModule = (function () {
  // Private variables
  let chats = StorageModule.loadData("chats") || [];
  let currentChatId = StorageModule.loadData("currentChatId");
  let conversation = [];



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
    fetchAzureOpenAIChatCompletion,
    getCurrentState,
    saveConversation,
    updateSelectedModel: function (newModelKey) {
      ConfigModule.updateConfig({ selectedModelKey: newModelKey });
    },
  };
})();
