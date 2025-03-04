/**
 * Models Module
 * Provides access to available models.
 */
const ModelsModule = (function () {
  function getModels() {
    // Fallback: if window.models is undefined, use window.defaultModels or an empty object.
    const models = window.models || window.defaultModels || {};
    Object.keys(models).forEach((key) => {
      if (!models[key].hasOwnProperty("classification_clearance")) {
        models[key].classification_clearance = 1; // default clearance
      }
    });
    return models;
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
