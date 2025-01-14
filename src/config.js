/**
 * Configuration Module
 * Manages application configuration settings.
 */
var ConfigModule = (function() {
    let config = {};

    // Use defaultConfig from config.js
    const defaultConfig = window.defaultConfig;

    function initialize() {
        // Load stored language or use default
        const storedLanguage = StorageModule.loadData('language');
        config.language = storedLanguage || defaultConfig.defaultLanguage || 'en';
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
        return {
            ...config,
            endpoint: StorageModule.loadData('endpoint') || '',
            apiKey: StorageModule.loadData('apiKey') || '',
            theme: StorageModule.loadData('theme') || 'light-mode',
            selectedModelKey: StorageModule.loadData('selectedModelKey') || 'gpt-4o',
            selectedInstructionId: StorageModule.loadData('selectedInstructionId') || instructions[0].id,
            lastUsedModelKey: StorageModule.loadData('selectedModelKey') || 'gpt-4o',
            lastUsedInstructionId: StorageModule.loadData('selectedInstructionId') || instructions[0].id,
            titleDeployment: StorageModule.loadData('titleDeployment') || '',
            language: StorageModule.loadData('language') || config.defaultLanguage || 'en'
        };
    }

    return {
        initialize,
        updateConfig,
        getConfig
    };
})();
