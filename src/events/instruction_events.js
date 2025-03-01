/**
 * Instruction Events Module
 * Handles events related to instruction management.
 */
const InstructionEventsModule = (function () {
  let editInstructionBtn;
  let instructionsSelect;

  function setupEventListeners() {
    editInstructionBtn = document.getElementById("edit-instruction-btn");
    instructionsSelect = document.getElementById("instructions-select");

    editInstructionBtn.addEventListener("click", handleEditInstructionClick);
    instructionsSelect.addEventListener("change", function() {
      handleInstructionChange.call(this);
    });

    populateInstructions();
  }

  async function populateInstructions() {
    instructionsSelect.innerHTML = "";
    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();

    const customInstructions = (await StorageModule.loadData("customInstructions")) || [];
    window.instructions = (window.defaultInstructions || [])
      .concat(window.additionalInstructions || [])
      .concat(customInstructions);

    const selectedInstructionId = 
      (currentChat && currentChat.selectedInstructionId) ||
      config.selectedInstructionId ||
      window.instructions[0]?.id;

    window.instructions.forEach((instruction) => {
      const option = document.createElement("option");
      option.value = instruction.id;
      option.textContent = instruction.label;
      instructionsSelect.appendChild(option);
    });

    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = TranslationModule.translate("createNewInstruction");
    instructionsSelect.appendChild(customOption);

    instructionsSelect.value = selectedInstructionId;
    updateEditButtonVisibility();
  }

  function updateEditButtonVisibility() {
    const selectedValue = instructionsSelect.value;
    // If the selected ID is not in the defaultInstructions, assume it's custom.
    const isCustomFromMemory = !(window.defaultInstructions || []).some(
      (instr) => instr.id === selectedValue
    );
    editInstructionBtn.style.display = isCustomFromMemory ? "inline-block" : "none";
  }

  async function handleEditInstructionClick() {
    const selectedInstructionId = instructionsSelect.value;
    let customInstructions = (await StorageModule.loadData("customInstructions")) || [];
    let instructionIndex = customInstructions.findIndex(
      (instr) => instr.id === selectedInstructionId
    );
    let instruction = customInstructions[instructionIndex];

    if (instruction) {
      ModalModule.showEditInstructionModal(
        TranslationModule.translate("editCustomInstructionTitle"),
        instruction.label,
        instruction.content,
        async function (result) {
          if (result) {
            if (result.action === "delete") {
              ModalModule.showCustomConfirm(
                TranslationModule.translate("confirmDeleteInstruction"),
                async function (confirmDelete) {
                  if (confirmDelete) {
                    customInstructions.splice(instructionIndex, 1);
                    await StorageModule.saveData("customInstructions", customInstructions);
                    await populateInstructions();
                    instructionsSelect.value = window.instructions[0].id;
                    ConfigModule.updateConfig({
                      selectedInstructionId: window.instructions[0].id,
                    });
                    const currentChat = ChatModule.getCurrentChat();
                    if (currentChat) {
                      currentChat.selectedInstructionId = window.instructions[0].id;
                      ChatModule.saveChats();
                    }
                    updateEditButtonVisibility();
                  }
                }
              );
            } else {
              instruction.label = result.label;
              instruction.content = result.content;
              customInstructions[instructionIndex] = instruction;
              await StorageModule.saveData("customInstructions", customInstructions);
              await populateInstructions();
              instructionsSelect.value = instruction.id;
              updateEditButtonVisibility();
            }
          }
        },
        true
      );
    }
  }

  async function handleInstructionChange() {
    if (this.value === "custom") {
      ModalModule.showEditInstructionModal(
        TranslationModule.translate("createCustomInstructionTitle"),
        "",
        "",
        async function (result) {
          if (result && result.label && result.content) {
            const newInstruction = {
              id: "custom_" + Date.now(),
              label: result.label,
              content: result.content,
            };
            let customInstructions = (await StorageModule.loadData("customInstructions")) || [];
            customInstructions.push(newInstruction);
            await StorageModule.saveData("customInstructions", customInstructions);

            await populateInstructions();
            instructionsSelect.value = newInstruction.id;
            await StorageModule.saveData("selectedInstructionId", newInstruction.id);
            ConfigModule.updateConfig({
              selectedInstructionId: newInstruction.id,
            });

            const currentChat = ChatModule.getCurrentChat();
            if (currentChat) {
              currentChat.selectedInstructionId = newInstruction.id;
              ChatModule.saveChats();
            }

            updateEditButtonVisibility();
          } else {
            instructionsSelect.value = ConfigModule.getConfig().selectedInstructionId;
          }
        }
      );
    } else {
      const newInstructionId = this.value;
      await StorageModule.saveData("selectedInstructionId", newInstructionId);
      ConfigModule.updateConfig({ selectedInstructionId: newInstructionId });
      const currentChat = ChatModule.getCurrentChat();
      if (currentChat) {
        currentChat.selectedInstructionId = newInstructionId;
        ChatModule.saveChats();
      }
      updateEditButtonVisibility();
    }
  }

  return {
    setupEventListeners,
    populateInstructions,
    updateEditButtonVisibility,
  };
})();
