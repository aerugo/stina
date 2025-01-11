/**
 * Storage Module
 * Abstracts localStorage interactions for persistent data.
 */
var StorageModule = (function () {
  /**
   * Saves data to localStorage under a specified key.
   * @param {string} key - The key under which to store the data.
   * @param {*} value - The data to store (will be JSON-stringified).
   */
  function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Loads data from localStorage by key.
   * @param {string} key - The key of the data to retrieve.
   * @returns {*} - The parsed data, or null if not found.
   */
  function loadData(key) {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing data for key "${key}":`, e);
      // Remove corrupted data
      localStorage.removeItem(key);
      return null;
    }
  }

  return {
    saveData,
    loadData,
  };
})();
