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




  return {
    updateSelectedModel: function (newModelKey) {
      ConfigModule.updateConfig({ selectedModelKey: newModelKey });
    },
  };
})();
