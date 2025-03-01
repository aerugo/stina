/**
 * Storage Initializer Module
 * Handles the initialization of storage and ensures the app starts only after storage is ready
 */
const StorageInitializerModule = (function () {
  // Flag to track if initialization is complete
  let initialized = false;

  // Function to initialize the app
  async function initialize() {
    if (initialized) return;

    try {
      console.log("Initializing storage...");

      // First, ensure the database is open and ready
      await StorageModule.openDatabase();

      // Then migrate data from localStorage if needed
      await migrateFromLocalStorage(); // This can be removed after some time

      // Mark initialization as complete
      initialized = true;
      console.log("Storage initialization complete");

      // Now initialize the app
      await InitializationModule.initializeApp();
    } catch (error) {
      console.error("Error initializing storage:", error);
      // Show error to user
      const errorDiv = document.createElement("div");
      errorDiv.className = "storage-error";
      errorDiv.textContent =
        "Failed to initialize storage. Please refresh the page or check browser settings.";
      document.body.appendChild(errorDiv);
    }
  }

  // Helper function to migrate data from localStorage to IndexedDB
  async function migrateFromLocalStorage() {
    console.log("Checking for localStorage data to migrate...");

    // List of keys to check for migration
    const keysToMigrate = [
      "chats",
      "currentChatId",
      "language",
      "provider",
      "providerConfigs",
      "endpoint",
      "apiKey",
      "theme",
      "selectedModelKey",
      "selectedInstructionId",
      "lastUsedModelKey",
      "lastUsedInstructionId",
      "titleDeployment",
      "customInstructions",
      "customModels",
    ];

    let migratedCount = 0;

    for (const key of keysToMigrate) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          // Check if data already exists in IndexedDB
          const existingData = await StorageModule.loadData(key);

          if (existingData === null) {
            // Only migrate if no data exists in IndexedDB
            const parsedValue = JSON.parse(value);
            await StorageModule.saveData(key, parsedValue);
            migratedCount++;
            console.log(`Migrated ${key} from localStorage to IndexedDB`);
          }
        } catch (err) {
          console.warn(`Failed to migrate ${key}:`, err);
        }
      }
    }

    if (migratedCount > 0) {
      console.log(`Migration complete. Migrated ${migratedCount} items.`);
    } else {
      console.log("No data needed migration.");
    }
  }

  // Start initialization when DOM is loaded
  document.addEventListener("DOMContentLoaded", initialize);

  return {
    initialize,
    isInitialized: () => initialized,
  };
})();
