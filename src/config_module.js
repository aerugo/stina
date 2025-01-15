/**
 * Configuration Module
 * Manages application configuration settings.
 */
const ConfigModule = (function () {
  let config = {};

  // Use defaultConfig from config.js
  const defaultConfig = window.defaultConfig;

  function initialize() {
    // Load stored language or use default
    const storedLanguage = StorageModule.loadData("language");
    config.language = storedLanguage || defaultConfig.defaultLanguage || "en";

    // Load stored provider or use default
    const storedProvider = StorageModule.loadData("provider");
    config.provider = storedProvider || defaultConfig.provider || "azure";

    // Initialize provider configurations
    let initialProviderConfigs = {};

    if (typeof window.providerConfigs === 'undefined' || Object.keys(window.providerConfigs).length === 0) {
      // providers.js not found or is empty, enable all providers by default
      initialProviderConfigs = {
        azure: { enabled: true, apiKey: '', endpoint: '', apiKeyFromProvidersJs: false, endpointFromProvidersJs: false },
        openai: { enabled: true, apiKey: '', apiKeyFromProvidersJs: false },
        ollama: { enabled: true, endpoint: '', endpointFromProvidersJs: false },
        anthropic: { enabled: true, apiKey: '', apiKeyFromProvidersJs: false }
      };
    } else {
      // Use providerConfigs from providers.js
      initialProviderConfigs = {};
      for (const provider in window.providerConfigs) {
        const providerConfig = window.providerConfigs[provider];
        const initialConfig = {
          enabled: providerConfig.enabled || false,
        };

        // For each possible property (apiKey, endpoint), set the value and mark if fromProvidersJs
        if ('apiKey' in providerConfig) {
          initialConfig.apiKey = providerConfig.apiKey;
          initialConfig.apiKeyFromProvidersJs = true;
        } else {
          initialConfig.apiKey = '';
          initialConfig.apiKeyFromProvidersJs = false;
        }

        if ('endpoint' in providerConfig) {
          initialConfig.endpoint = providerConfig.endpoint;
          initialConfig.endpointFromProvidersJs = true;
        } else {
          initialConfig.endpoint = '';
          initialConfig.endpointFromProvidersJs = false;
        }

        initialProviderConfigs[provider] = initialConfig;
      }
    }

    // Load stored providerConfigs from local storage and merge
    const storedProviderConfigs = StorageModule.loadData("providerConfigs") || {};

    // Merge stored configurations over initial configurations
    config.providerConfigs = {};
    for (const provider in initialProviderConfigs) {
      config.providerConfigs[provider] = {
        ...initialProviderConfigs[provider],
        ...storedProviderConfigs[provider],
        // Preserve the per-property fromProvidersJs flags
        apiKeyFromProvidersJs: initialProviderConfigs[provider].apiKeyFromProvidersJs,
        endpointFromProvidersJs: initialProviderConfigs[provider].endpointFromProvidersJs,
      };
    }
  }

  /**
   * Updates the configuration settings.
   * @param {Object} newConfig - The new configuration settings.
   */
  function updateConfig(newConfig) {
    for (let key in newConfig) {
      const value = newConfig[key];
      if (value !== undefined && value !== null) {
        StorageModule.saveData(key, value);
      } else {
        // Remove the item from storage if value is undefined or null
        StorageModule.saveData(key, value);
      }
    }
  }

  /**
   * Retrieves the current configuration.
   * @returns {Object} The current configuration settings.
   */
  function getConfig() {
    const storedProvider =
      StorageModule.loadData("provider") || config.provider || "azure";
    const providerConfig = config.providerConfigs[storedProvider] || {};

    return {
      ...config,
      endpoint:
        providerConfig.endpoint || StorageModule.loadData("endpoint") || "",
      apiKey: providerConfig.apiKey || StorageModule.loadData("apiKey") || "",
      theme: StorageModule.loadData("theme") || "light-mode",
      selectedModelKey: StorageModule.loadData("selectedModelKey") || "gpt-4o",
      selectedInstructionId:
        StorageModule.loadData("selectedInstructionId") || instructions[0].id,
      lastUsedModelKey: StorageModule.loadData("selectedModelKey") || "gpt-4o",
      lastUsedInstructionId:
        StorageModule.loadData("selectedInstructionId") || instructions[0].id,
      titleDeployment: StorageModule.loadData("titleDeployment") || "",
      language:
        StorageModule.loadData("language") || config.defaultLanguage || "en",
      provider: storedProvider,
      providerConfigs: config.providerConfigs,
    };
  }

  return {
    initialize,
    updateConfig,
    getConfig,
  };
})();
