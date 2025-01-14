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

  return {
    getModels,
    getModel,
  };
})();
