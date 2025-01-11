/**
 * Configuration Module
 * Manages application configuration settings.
 */
const ConfigModule = (function() {
    let config = {
        endpoint: localStorage.getItem('endpoint') || '',
        apiKey: localStorage.getItem('apiKey') || '',
        theme: localStorage.getItem('theme') || 'light-mode',
        selectedModelKey: localStorage.getItem('selectedModelKey') || 'gpt-4o',
        titleDeployment: localStorage.getItem('titleDeployment') || ''
    };

    function updateConfig(newEndpoint, newApiKey, newTheme, newTitleDeployment, newSelectedModelKey) {
        config = {
            endpoint: newEndpoint,
            apiKey: newApiKey,
            theme: newTheme,
            titleDeployment: newTitleDeployment,
            selectedModelKey: newSelectedModelKey
        };

        localStorage.setItem('endpoint', newEndpoint);
        localStorage.setItem('apiKey', newApiKey);
        localStorage.setItem('theme', newTheme);
        localStorage.setItem('titleDeployment', newTitleDeployment);
        localStorage.setItem('selectedModelKey', newSelectedModelKey);
    }

    function getConfig() {
        return { ...config };
    }

    return {
        updateConfig,
        getConfig
    };
})();
