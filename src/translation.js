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

  function applyTranslations() {
    document.querySelectorAll('[data-translation-key]').forEach(elem => {
      const key = elem.getAttribute('data-translation-key');
      const textElem = elem.querySelector('span:not(.icon)');
      if (textElem) {
        textElem.innerText = translate(key);
      } else {
        elem.innerText = translate(key);
      }
    });
  }

  return {
    initialize,
    setLanguage,
    translate,
    applyTranslations,
  };
})();
