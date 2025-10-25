/**
 * Storage Utilities
 *
 * Safe localStorage/sessionStorage wrapper with error handling and type safety.
 * Handles JSON serialization/deserialization and provides fallbacks for SSR.
 */

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get item from localStorage
 */
export function getLocalStorage<T>(key: string, defaultValue?: T): T | null {
  if (!isBrowser()) {
    return defaultValue ?? null;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : (defaultValue ?? null);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue ?? null;
  }
}

/**
 * Set item in localStorage
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorage(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Clear all localStorage
 */
export function clearLocalStorage(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Get item from sessionStorage
 */
export function getSessionStorage<T>(key: string, defaultValue?: T): T | null {
  if (!isBrowser()) {
    return defaultValue ?? null;
  }

  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : (defaultValue ?? null);
  } catch (error) {
    console.error(`Error reading sessionStorage key "${key}":`, error);
    return defaultValue ?? null;
  }
}

/**
 * Set item in sessionStorage
 */
export function setSessionStorage<T>(key: string, value: T): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting sessionStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from sessionStorage
 */
export function removeSessionStorage(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing sessionStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Clear all sessionStorage
 */
export function clearSessionStorage(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.sessionStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
    return false;
  }
}

/**
 * Get all keys from localStorage
 */
export function getLocalStorageKeys(): string[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    return Object.keys(window.localStorage);
  } catch (error) {
    console.error('Error getting localStorage keys:', error);
    return [];
  }
}

/**
 * Get storage size in bytes
 */
export function getLocalStorageSize(): number {
  if (!isBrowser()) {
    return 0;
  }

  try {
    let total = 0;
    for (const key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        total += window.localStorage[key].length + key.length;
      }
    }
    return total;
  } catch (error) {
    console.error('Error calculating localStorage size:', error);
    return 0;
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export default {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  getSessionStorage,
  setSessionStorage,
  removeSessionStorage,
  clearSessionStorage,
  getLocalStorageKeys,
  getLocalStorageSize,
  isLocalStorageAvailable,
};
