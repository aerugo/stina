/**
 * Theme Module
 * Manages application theme settings and application.
 */
const ThemeModule = (function() {
    function applyTheme(theme) {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(theme);
        StorageModule.saveData('theme', theme);
    }

    function getCurrentTheme() {
        return StorageModule.loadData('theme') || 'light-mode';
    }

    return {
        applyTheme,
        getCurrentTheme
    };
})();
