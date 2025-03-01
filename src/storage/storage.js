/**
 * Storage Module
 * Abstracts IndexedDB interactions for persistent data.
 */
const StorageModule = (function () {
  const DB_NAME = "StinaAI_DB";
  const STORE_NAME = "appData";
  const DB_VERSION = 1;
  let dbPromise = null;

  function openDatabase() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    }
    return dbPromise;
  }

  async function saveData(key, value) {
    if (value === undefined || value === null) {
      return removeData(key);
    }
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const txn = db.transaction([STORE_NAME], "readwrite");
      const store = txn.objectStore(STORE_NAME);
      const request = store.put(JSON.stringify(value), key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function loadData(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const txn = db.transaction([STORE_NAME], "readonly");
      const store = txn.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(request.result));
        } catch (err) {
          removeData(key);
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function removeData(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const txn = db.transaction([STORE_NAME], "readwrite");
      const store = txn.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function clearAll() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const txn = db.transaction([STORE_NAME], "readwrite");
      const store = txn.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  return {
    saveData,
    loadData,
    removeData,
    clearAll
  };
})();
