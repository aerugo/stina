/**
 * Storage Module
 * Abstracts localStorage interactions for persistent data.
 */
const StorageModule = (function () {
  /**
   * Saves data to localStorage under a specified key.
   * @param {string} key - The key under which to store the data.
   * @param {*} value - The data to store (will be JSON-stringified).
   */
  function saveData(key, value) {
    if (value === undefined || value === null) {
      // Remove the item from storage if the value is undefined or null
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`Error removing data for key "${key}":`, e);
      }
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Error saving data for key "${key}":`, e);
      }
    }
  }

  /**
   * Loads data from localStorage by key.
   * @param {string} key - The key of the data to retrieve.
   * @returns {*} - The parsed data, or null if not found or on error.
   */
  function loadData(key) {
    try {
      const data = localStorage.getItem(key);
      if (!data || data === "undefined" || data === "null") return null;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(`Error parsing data for key "${key}":`, e);
        localStorage.removeItem(key);
        return null;
      }
    } catch (e) {
      console.error(`Error accessing localStorage for key "${key}":`, e);
      return null;
    }
  }

  return {
    saveData,
    loadData,
  };
})();
