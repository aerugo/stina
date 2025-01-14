/**
 * Translation Module
 * Handles localization and translations
 */
var TranslationModule = (function() {
  let translations = {};
  let currentLanguage = 'en';

  async function initialize() {
    // Fetch translations.yaml
    const response = await fetch('src/translations.yaml');
    const yamlText = await response.text();
    translations = jsyaml.load(yamlText);

    // Set the current language from ConfigModule
    const config = ConfigModule.getConfig();
    currentLanguage = config.language || 'en';
  }

  function setLanguage(lang) {
    currentLanguage = lang;
  }

  function translate(key) {
    return translations[currentLanguage]?.[key] || key;
  }

  return {
    initialize,
    setLanguage,
    translate,
  };
})();
