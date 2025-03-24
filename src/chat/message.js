/**
 * Message Module
 * Handles message creation, processing, and conversation management.
 */
const MessageModule = (function () {
  const providers = {
    azure: AzureProvider,
    openai: OpenAIProvider,
    anthropic: AnthropicProvider,
    ollama: OllamaProvider,
  };
  function findWeakModelKey() {
    const allModels = ModelsModule.getModels();
    for (const [key, modelDef] of Object.entries(allModels)) {
      if (modelDef.weak === true) {
        return key;
      }
    }
    return null;
  }
  async function generateChatTitle(userMessage) {
    const models = ModelsModule.getModels();
    const prompt = `${TranslationModule.translate(
      "generateTitlePrompt"
    )} ${userMessage}`;
    const titleMessage = { role: "user", content: prompt };
    const config = ConfigModule.getConfig();

    // Get the selected model or default to 'gpt-4o', preferring a weak model if available
    const weakModelKey = findWeakModelKey();
    const selectedModelKey = weakModelKey
      ? weakModelKey
      : config.selectedModelKey || "gpt-4o";
    let selectedModel = models[selectedModelKey];

    // If selectedModel is undefined, fallback to 'gpt-4o'
    if (!selectedModel) {
      console.warn(
        `Selected model "${selectedModelKey}" not found. Using default model "gpt-4o".`
      );
      selectedModel = models["gpt-4o"];
    }

    if (!selectedModel) {
      throw new Error("No valid model found for generating title");
    }

    // Use the titleDeployment from config or default to the selected model's deployment
    const titleDeployment = config.titleDeployment || selectedModel.deployment;

    // Get provider and config
    const provider = selectedModel.provider;
    if (!provider) {
      throw new Error(
        `Provider is not defined for model "${selectedModelKey}"`
      );
    }

    const providerConfig = config.providerConfigs[provider] || {};

    // Initialize provider
    const ProviderClass = providers[provider];
    if (!ProviderClass) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    const providerInstance = new ProviderClass();

    // Validate provider configuration
    providerInstance.validateConfig(providerConfig);

    // Prepare messages using the provider's method
    const preparedMessages = providerInstance.prepareMessages([titleMessage]);

    // Prepare model options
    const modelOptions = {
      temperature: selectedModel.temperature || 0.7,
    };

    // Call the API using the provider instance
    const apiResponse = await providerInstance.fetchChatCompletion(
      preparedMessages,
      titleDeployment,
      modelOptions,
      providerConfig
    );

    return apiResponse.content.trim().replace(/[\n\r]/g, "");
  }

  function saveConversation(chatId, conversation) {
    const chat = ChatModule.getCurrentChat();
    if (chat) {
      chat.conversation = conversation;
      StorageModule.saveData("chats", ChatModule.getCurrentState().chats);
    }
  }

  async function sendMessage(messageContent) {
    const config = ConfigModule.getConfig();

    // Get and clear any pending uploaded files
    const attachedFiles = FileUploadEventsModule.getAndClearPendingFiles();
    console.log("[DEBUG][sendMessage] Attached Files:", attachedFiles);

    console.log("[DEBUG][sendMessage] Attached Files:", attachedFiles);

    const currentState = ChatModule.getCurrentState();
    const currentChat = ChatModule.getCurrentChat();
    const selectedModelKey = currentChat.selectedModelKey || "gpt-4o";
    const selectedModelParams = ModelsModule.getModel(selectedModelKey);

    // Determine the maximum classification level from all attached files in the current chat
    let maxRequiredClearance = 1;

    // Check existing conversation files
    currentState.conversation.forEach((msg) => {
      if (msg.attachedFiles && Array.isArray(msg.attachedFiles)) {
        msg.attachedFiles.forEach((file) => {
          if (!file.ignored) {
            // Only consider non-ignored files
            const fileLevel = file.classificationLevel || 1;
            if (fileLevel > maxRequiredClearance) {
              maxRequiredClearance = fileLevel;
            }
          }
        });
      }
    });

    // Check new files being attached
    attachedFiles.forEach((file) => {
      if (!file.ignored) {
        // Only consider non-ignored files
        const fileLevel = file.classificationLevel || 1;
        if (fileLevel > maxRequiredClearance) {
          maxRequiredClearance = fileLevel;
        }
      }
    });

    // Check if model has sufficient clearance
    const modelClearance = selectedModelParams.classification_clearance || 1;
    if (modelClearance < maxRequiredClearance) {
      // Show warning in the classification warning element instead of a modal
      const warningEl = document.getElementById("classification-warning");
      if (warningEl) {
        warningEl.style.display = "block";
        warningEl.textContent = `${
          TranslationModule.translate("insufficientModelClearance") ||
          "Selected model clearance"
        } (${modelClearance}) ${
          TranslationModule.translate("insufficientForDocuments") ||
          "is insufficient for the chat's documents"
        } (${
          TranslationModule.translate("required") || "required"
        }: ${maxRequiredClearance}). ${
          TranslationModule.translate("pleaseSelectHigherClearanceModel") ||
          "Please select a model with higher clearance."
        }`;
      }

      // Disable send button
      const sendBtn = document.getElementById("send-btn");
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.classList.add("is-disabled");
      }

      return; // Block sending the message
    }

    const newMessage = {
      role: "user",
      content: messageContent,
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
      attachmentsLocked: true, // Mark these attachments as locked (historical)
    };
    currentState.conversation.push(newMessage);

    // Build lists of ignored documents, documents using summaries, and documents using full text
    function getIgnoredAndSummaryDocs(conversation) {
      const ignoredDocs = [];
      const summaryDocs = [];
      const fullDocs = [];
      conversation.forEach((msg) => {
        if (msg.role === "user" && Array.isArray(msg.attachedFiles)) {
          msg.attachedFiles.forEach((file) => {
            if (file.ignored) {
              ignoredDocs.push(file.fileName);
            } else {
              // Check for summaries
              if (
                file.selectedSummaryIds &&
                file.selectedSummaryIds.length > 0 &&
                file.summaries &&
                file.summaries.length > 0
              ) {
                const summaryNames = file.selectedSummaryIds
                  .map((id) => {
                    const summaryObj = file.summaries.find((s) => s.id === id);
                    return summaryObj ? summaryObj.name : "unknown";
                  })
                  .join(", ");
                summaryDocs.push(
                  `${file.fileName} (${TranslationModule.translate(
                    "summaries"
                  )} ${summaryNames})`
                );
              }

              // Check for full document usage
              if (file.useFullDocument) {
                fullDocs.push(file.fileName);
              }
            }
          });
        }
      });
      return { ignoredDocs, summaryDocs, fullDocs };
    }

    const { ignoredDocs, summaryDocs, fullDocs } = getIgnoredAndSummaryDocs(
      currentState.conversation
    );
    if (
      ignoredDocs.length > 0 ||
      summaryDocs.length > 0 ||
      fullDocs.length > 0
    ) {
      let noticeMsgContent = "";
      if (ignoredDocs.length > 0) {
        noticeMsgContent +=
          TranslationModule.translate("ignoredDocuments") +
          ": " +
          ignoredDocs.join(", ");
      }
      if (summaryDocs.length > 0) {
        if (noticeMsgContent) noticeMsgContent += "; ";
        noticeMsgContent +=
          TranslationModule.translate("documentsUsingSummaries") +
          ": " +
          summaryDocs.join(", ");
      }
      if (fullDocs.length > 0) {
        if (noticeMsgContent) noticeMsgContent += "; ";
        noticeMsgContent +=
          TranslationModule.translate("documentsUsingFullText") +
          ": " +
          fullDocs.join(", ");
      }
      const noticeMsg = {
        role: "system",
        content: noticeMsgContent,
        isIgnoredDocsNotice: true,
      };
      currentState.conversation.push(noticeMsg);
    }

    RenderingModule.renderConversation(currentState.conversation);
    MessageModule.saveConversation(
      currentState.currentChatId,
      currentState.conversation
    );

    DocumentsManagerEventsModule.updateDocumentsButtonVisibility();

    // Update lastUpdated after adding user message
    ChatModule.updateChatLastUpdated(currentState.currentChatId);

    // Use the model parameters we already retrieved earlier
    const deploymentName = selectedModelParams.deployment;

    // Get the provider and config
    const provider = selectedModelParams.provider;
    const providerConfig = config.providerConfigs[provider] || {};

    // Initialize provider
    const ProviderClass = providers[provider];
    if (!ProviderClass) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    const providerInstance = new ProviderClass();

    // Validate provider configuration
    providerInstance.validateConfig(providerConfig);

    // Start with a copy of the conversation WITHOUT the loading message
    let conversationToSend = [...currentState.conversation];
    // Declare instruction variable outside the if block so it's available for the API request
    let instruction = null;
    let instructionLabel = "";

    // Handle system message if the model supports it (undefined is treated as supported)
    if (selectedModelParams && selectedModelParams.system !== false) {
      // Get latest instruction ID and custom instructions
      const selectedInstructionId =
        currentChat.selectedInstructionId ||
        config.selectedInstructionId ||
        (window.instructions && window.instructions[0]
          ? window.instructions[0].id
          : null);

      const customInstructions =
        (await StorageModule.loadData("customInstructions")) || [];

      // Find selected instruction
      instruction =
        customInstructions.find(
          (instr) => instr.id === selectedInstructionId
        ) ||
        window.instructions.find(
          (instr) => instr.id === selectedInstructionId
        ) ||
        (window.instructions && window.instructions[0]) ||
        null;

      if (!instruction) {
        // This fallback should not normally occur.
        console.warn("No valid instruction found; falling back to default.");
        instruction = window.instructions && window.instructions[0];
      }

      instructionLabel = instruction ? instruction.label : "";
    }

    // Conditionally merge attached file contents into user messages, skipping ignored files.
    conversationToSend = conversationToSend.map((msg) => {
      if (
        msg.role === "user" &&
        Array.isArray(msg.attachedFiles) &&
        msg.attachedFiles.length > 0
      ) {
        let mergedContent = "";
        console.log(
          "Merging attached files for message. Count:",
          msg.attachedFiles.length
        );
        msg.attachedFiles.forEach((file) => {
          if (!file.ignored) {
            // Only merge if not ignored
            console.log("Merging file:", file.fileName);
            let fileContent = "";

            // If the user has chosen to include the full document text:
            if (file.useFullDocument) {
              const fileLevel = file.classificationLevel || 1;
              const modelClearance =
                selectedModelParams.classification_clearance || 1;
              if (modelClearance < fileLevel) {
                console.warn(
                  `Skipping file "${file.fileName}" due to insufficient model clearance.`
                );
                return; // skip merging this file
              }

              // Normalize newlines to LF for consistency
              const normalizedContent = file.content
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");
              fileContent += `=== ${file.fileName} (FULL) ===\n${normalizedContent}\n\n----------\n`;
            }

            // Gather each selected summary, if any:
            if (
              Array.isArray(file.selectedSummaryIds) &&
              file.selectedSummaryIds.length > 0
            ) {
              file.selectedSummaryIds.forEach((summaryId) => {
                const summaryObj = file.summaries.find(
                  (s) => s.id === summaryId
                );
                if (summaryObj) {
                  const fileLevel = file.classificationLevel || 1;
                  const modelClearance =
                    selectedModelParams.classification_clearance || 1;
                  if (modelClearance < fileLevel) {
                    console.warn(
                      `Skipping summary for "${file.fileName}" due to insufficient model clearance.`
                    );
                    return; // skip this summary
                  }

                  console.log(
                    "Including summary for:",
                    file.fileName,
                    "Summary:",
                    summaryObj.name
                  );
                  fileContent += `=== ${file.fileName} [SUMMARY: ${summaryObj.name}] ===\n${summaryObj.content}\n\n----------\n`;
                }
              });
            }

            mergedContent += fileContent;
          } else {
            console.log("Skipping ignored file:", file.fileName);
          }
        });
        mergedContent += msg.content;
        console.log("Resulting merged content:", mergedContent);
        return { ...msg, content: mergedContent };
      }
      return msg;
    });

    // Prepare the messages normally:
    if (selectedModelParams && selectedModelParams.system !== false) {
      // Prepare messages using the provider's method with instruction
      conversationToSend = providerInstance.prepareMessages(
        conversationToSend,
        instruction
      );
    } else {
      // Even if the model doesn't support system messages,
      // we might still need to prepare messages
      conversationToSend = providerInstance.prepareMessages(conversationToSend);
    }

    // Filter out any messages that are just ignored documents notices
    conversationToSend = conversationToSend.filter(
      (msg) => !msg.isIgnoredDocsNotice
    );

    const loadingMessage = { role: "assistant", content: "", isLoading: true };
    currentState.conversation.push(loadingMessage);
    RenderingModule.renderConversation(currentState.conversation);

    try {
      // Prepare model options
      const modelOptions = {
        max_tokens: selectedModelParams.max_tokens,
        temperature: selectedModelParams.temperature,
        top_p: selectedModelParams.top_p,
        frequency_penalty: selectedModelParams.frequency_penalty,
        presence_penalty: selectedModelParams.presence_penalty,
        stop: selectedModelParams.stop,
      };

      // Call the API directly on the provider instance
      console.log("Sending request with:", {
        conversationToSend,
        deploymentName,
        modelOptions,
        providerConfig,
      });

      const apiResponse = await providerInstance.fetchChatCompletion(
        conversationToSend,
        deploymentName,
        modelOptions,
        providerConfig
      );

      // Now log the response after it's been initialized
      console.log("apiResponse:", apiResponse);
      console.log(
        "apiResponse.content:",
        apiResponse.content,
        "Type:",
        typeof apiResponse.content
      );

      // The ignored documents notice is now added right after the user message
      // so we don't need to add it here

      currentState.conversation[currentState.conversation.length - 1] = {
        role: "assistant",
        content:
          typeof apiResponse.content === "string"
            ? apiResponse.content
            : apiResponse.content.raw ||
              apiResponse.content.text ||
              JSON.stringify(apiResponse.content),
        model: selectedModelKey,
        instructionLabel: instructionLabel,
        usage: apiResponse.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };

      RenderingModule.renderConversation(currentState.conversation);
      MessageModule.saveConversation(
        currentState.currentChatId,
        currentState.conversation
      );
      // Re-check token usage right after the new assistant message is added
      InputEventsModule.checkTokenWarning();

      // Update lastUpdated after receiving assistant's response
      ChatModule.updateChatLastUpdated(currentState.currentChatId);

      const chat = ChatModule.getCurrentChat();
      if (chat.isNewChat) {
        try {
          const title = await MessageModule.generateChatTitle(messageContent);
          ChatModule.updateChatTitle(chat.id, title);
        } catch (error) {
          console.error(
            TranslationModule.translate("errorGeneratingTitle"),
            error
          );
          ChatModule.updateChatTitle(
            chat.id,
            TranslationModule.translate("newChat")
          );
        }
        // Set isNewChat to false after title has been updated
        chat.isNewChat = false;
        ChatModule.saveChats();

        // Render chat list after updating isNewChat
        RenderingModule.renderChatList(
          ChatModule.getCurrentState().chats,
          currentState.currentChatId
        );
      }
    } catch (error) {
      // Remove loading message
      currentState.conversation.pop();
      RenderingModule.renderConversation(currentState.conversation);
      // Show error message to the user
      ModalModule.showCustomAlert(
        `${TranslationModule.translate("errorSendingMessage")} ${error.message}`
      );
      console.error("Error during sendMessage:", error);
    }
  }

  return {
    generateChatTitle,
    saveConversation,
    sendMessage,
  };
})();

// Expose MessageModule globally so other modules can access it.
window.MessageModule = MessageModule;
