/**
 * Configuration Module
 * Manages application configuration settings.
 */
const ConfigModule = (function() {
    let config = {
        endpoint: StorageModule.loadData('endpoint') || '',
        apiKey: StorageModule.loadData('apiKey') || '',
        theme: StorageModule.loadData('theme') || 'light-mode',
        selectedModelKey: StorageModule.loadData('selectedModelKey') || 'gpt-4o',
        titleDeployment: StorageModule.loadData('titleDeployment') || ''
    };

    /**
     * Updates the configuration settings.
     * @param {Object} newConfig - The new configuration settings.
     */
    function updateConfig(newConfig) {
        Object.assign(config, newConfig);
        for (let key in newConfig) {
            StorageModule.saveData(key, newConfig[key]);
        }
    }

    /**
     * Retrieves the current configuration.
     * @returns {Object} The current configuration settings.
     */
    function getConfig() {
        return { ...config };
    }

    return {
        updateConfig,
        getConfig
    };
})();
