/**
 * Models Module
 * Provides access to available models.
 */
var ModelsModule = (function () {
  function getModels() {
    return window.models;
  }

  function getModel(key) {
    return window.models[key];
  }

  function getModelsByProvider(provider) {
    const models = window.models;
    const filteredModels = {};
    for (const [key, model] of Object.entries(models)) {
      if (model.provider === provider) {
        filteredModels[key] = model;
      }
    }
    return filteredModels;
  }

  return {
    getModels,
    getModel,
    getModelsByProvider,
  };
})();
