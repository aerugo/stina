/**
 * Settings Events Module
 * Handles events related to settings management.
 */
const SettingsEventsModule = (function () {
  function setupEventListeners() {
    const settingsBtn = document.getElementById("settings-btn");
    settingsBtn.addEventListener("click", openSettingsModal);
  }

  function openSettingsModal() {
    const modalContent = `
      <div class="columns">
        <div class="column is-one-quarter">
          <aside class="menu">
            <p class="menu-label">${TranslationModule.translate("settings")}</p>
            <ul class="menu-list">
              <li><a id="settings-tab-providers" class="is-active">${TranslationModule.translate("providers")}</a></li>
              <li><a id="settings-tab-language">${TranslationModule.translate("language")}</a></li>
              <li><a id="settings-tab-data">${TranslationModule.translate("data")}</a></li>
            </ul>
          </aside>
        </div>
        <div class="column">
          <div id="settings-content"></div>
        </div>
      </div>
    `;

    const buttons = [
      { label: TranslationModule.translate("cancel"), value: false },
      { label: TranslationModule.translate("saveChanges"), value: true, class: "is-success" },
    ];

    ModalModule.showCustomModal(
      TranslationModule.translate("settings"),
      modalContent,
      buttons,
      function (result) {
        if (result) {
          saveSettings();
        }
      }
    );

    setTimeout(setupSettingsTabs, 0);
  }

  function setupSettingsTabs() {
    const tabs = {
      providers: document.getElementById("settings-tab-providers"),
      language: document.getElementById("settings-tab-language"),
      data: document.getElementById("settings-tab-data")
    };
    const settingsContent = document.getElementById("settings-content");

    function deactivateAllTabs() {
      Object.values(tabs).forEach(tab => tab.classList.remove("is-active"));
    }

    Object.entries(tabs).forEach(([key, tab]) => {
      tab.addEventListener("click", () => {
        deactivateAllTabs();
        tab.classList.add("is-active");
        settingsContent.innerHTML = getTabContent(key);
        setupTabEventListeners(key);
      });
    });

    // Initially display Providers content
    settingsContent.innerHTML = getTabContent("providers");
    setupTabEventListeners("providers");
  }

  function getTabContent(tab) {
    switch (tab) {
      case "providers": return getProvidersContent();
      case "language": return getLanguageContent();
      case "data": return getDataContent();
      default: return "";
    }
  }

  function setupTabEventListeners(tab) {
    switch (tab) {
      case "providers": setupProvidersTabEventListeners(); break;
      case "language": setupLanguageTabEventListeners(); break;
      case "data": setupDataTabEventListeners(); break;
    }
  }

  function saveSettings() {
    const config = ConfigModule.getConfig();
    const updatedConfig = {
      providerConfigs: collectProviderConfigs(),
      language: document.getElementById("language-select")?.value || config.language,
      theme: document.body.classList.contains("light-mode") ? "light-mode" : "dark-mode"
    };

    ConfigModule.updateConfig(updatedConfig);
    TranslationModule.setLanguage(updatedConfig.language);
    TranslationModule.applyTranslations();

    ModalModule.showCustomAlert(TranslationModule.translate("settingsSaved"));
  }

  return {
    setupEventListeners
  };
})();
