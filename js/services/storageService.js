/**
 * Storage Service: Safe localStorage abstraction with in-memory fallback,
 * JSON error handling, and quota management.
 */

class StorageService {
  constructor() {
    this.memoryStorage = new Map();
    this.isLocalStorageAvailable = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const testKey = '__masoft_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key, defaultValue = null) {
    if (this.isLocalStorageAvailable) {
      try {
        const item = window.localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item);
      } catch (err) {
        console.warn(`[StorageService] Corrupted data for key "${key}", returning default.`, err);
        return defaultValue;
      }
    }
    return this.memoryStorage.has(key) ? this.memoryStorage.get(key) : defaultValue;
  }

  setItem(key, value) {
    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.error(`[StorageService] Failed to set localStorage key "${key}". Quota exceeded or private mode.`, err);
      }
    }
    this.memoryStorage.set(key, value);
    return true;
  }

  removeItem(key) {
    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.error(`[StorageService] Failed to remove key "${key}".`, err);
      }
    }
    this.memoryStorage.delete(key);
  }

  clear() {
    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.clear();
      } catch (err) {
        console.error(`[StorageService] Failed to clear storage.`, err);
      }
    }
    this.memoryStorage.clear();
  }
}

export const storageService = new StorageService();
