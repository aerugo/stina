/**
 * Configuration Module
 * Manages application configuration settings.
 */
var ConfigModule = (function() {
    let config = {};

    async function initialize() {
        // Fetch config.yaml
        const response = await fetch('config.yaml');
        const yamlText = await response.text();
        const yamlConfig = jsyaml.load(yamlText);

        // Set default language
        config.defaultLanguage = yamlConfig.defaultLanguage || 'en';

        // Load stored language or use default
        const storedLanguage = StorageModule.loadData('language');
        config.language = storedLanguage || config.defaultLanguage;
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
