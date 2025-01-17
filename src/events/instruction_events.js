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
    instructionsSelect.addEventListener("change", handleInstructionChange);

    populateInstructions();
    updateEditButtonVisibility();
  }

  function populateInstructions() {
    instructionsSelect.innerHTML = "";
    const currentChat = ChatModule.getCurrentChat();
    const config = ConfigModule.getConfig();

    const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
    window.instructions = window.defaultInstructions.concat(customInstructions);

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
    const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
    const isCustomFromMemory = customInstructions.some(
      (instr) => instr.id === selectedValue
    );

    editInstructionBtn.style.display = isCustomFromMemory ? "inline-block" : "none";
  }

  function handleEditInstructionClick() {
    const selectedInstructionId = instructionsSelect.value;
    let customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
    let instructionIndex = customInstructions.findIndex(
      (instr) => instr.id === selectedInstructionId
    );
    let instruction = customInstructions[instructionIndex];

    if (instruction) {
      ModalModule.showEditInstructionModal(
        TranslationModule.translate("editCustomInstructionTitle"),
        instruction.label,
        instruction.content,
        function (result) {
          if (result) {
            if (result.action === "delete") {
              ModalModule.showCustomConfirm(
                TranslationModule.translate("confirmDeleteInstruction"),
                function (confirmDelete) {
                  if (confirmDelete) {
                    customInstructions.splice(instructionIndex, 1);
                    localStorage.setItem(
                      "customInstructions",
                      JSON.stringify(customInstructions)
                    );
                    populateInstructions();
                    instructionsSelect.value = instructions[0].id;
                    ConfigModule.updateConfig({
                      selectedInstructionId: instructions[0].id,
                    });
                    const currentChat = ChatModule.getCurrentChat();
                    if (currentChat) {
                      currentChat.selectedInstructionId = instructions[0].id;
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
              localStorage.setItem(
                "customInstructions",
                JSON.stringify(customInstructions)
              );
              populateInstructions();
              instructionsSelect.value = instruction.id;
              updateEditButtonVisibility();
            }
          }
        },
        true
      );
    }
  }

  function handleInstructionChange() {
    if (this.value === "custom") {
      ModalModule.showEditInstructionModal(
        TranslationModule.translate("createCustomInstructionTitle"),
        "",
        "",
        function (result) {
          if (result && result.label && result.content) {
            const newInstruction = {
              id: "custom_" + Date.now(),
              label: result.label,
              content: result.content,
            };

            const customInstructions = JSON.parse(localStorage.getItem("customInstructions")) || [];
            customInstructions.push(newInstruction);
            localStorage.setItem("customInstructions", JSON.stringify(customInstructions));

            populateInstructions();
            instructionsSelect.value = newInstruction.id;
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
      ConfigModule.updateConfig({ selectedInstructionId: this.value });
      const currentChat = ChatModule.getCurrentChat();
      if (currentChat) {
        currentChat.selectedInstructionId = this.value;
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
