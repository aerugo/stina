/**
 * Configuration Module
 * Manages application configuration settings.
 */
var ConfigModule = (function() {
    /**
     * Updates the configuration settings.
     * @param {Object} newConfig - The new configuration settings.
     */
    function updateConfig(newConfig) {
        for (let key in newConfig) {
            StorageModule.saveData(key, newConfig[key]);
        }
    }

    /**
     * Retrieves the current configuration.
     * @returns {Object} The current configuration settings.
     */
    function getConfig() {
        return {
            endpoint: StorageModule.loadData('endpoint') || '',
            apiKey: StorageModule.loadData('apiKey') || '',
            theme: StorageModule.loadData('theme') || 'light-mode',
            selectedModelKey: StorageModule.loadData('selectedModelKey') || 'gpt-4o',
            selectedInstructionId: StorageModule.loadData('selectedInstructionId') || instructions[0].id,
            lastUsedModelKey: StorageModule.loadData('selectedModelKey') || 'gpt-4o',
            lastUsedInstructionId: StorageModule.loadData('selectedInstructionId') || instructions[0].id,
            titleDeployment: StorageModule.loadData('titleDeployment') || ''
        };
    }

    return {
        updateConfig,
        getConfig
    };
})();
