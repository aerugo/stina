/**
 * Translation Module
 * Handles localization and translations
 */
var TranslationModule = (function() {
  let currentLanguage = 'en';

  // Use translationsData from translations.js
  const translations = window.translationsData;

  function initialize() {
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
