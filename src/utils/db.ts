const DB_NAME = 'NotoLargeStorage';
const DB_VERSION = 1;
const STORE_NAME = 'large_items';

const memoryCache: Record<string, string> = {};

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function setLargeItem(key: string, value: string): Promise<void> {
  memoryCache[key] = value;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getLargeItem(key: string): Promise<string | null> {
  if (memoryCache[key]) return memoryCache[key];
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result) memoryCache[key] = request.result;
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("IndexedDB get error:", e);
    return null;
  }
}

export function getLargeItemSync(key: string): string | null {
  return memoryCache[key] || null;
}

export async function deleteLargeItem(key: string): Promise<void> {
  delete memoryCache[key];
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function preloadLargeItems(): Promise<void> {
  const keys = ['user_avatar', 'noto_custom_wallpaper', 'noto_banner_wallpaper', 'noto_notes', 'noto_tasks', 'noto_transactions', 'noto_moods'];
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      let completed = 0;
      for (const key of keys) {
        const request = store.get(key);
        request.onsuccess = () => {
          if (request.result) memoryCache[key] = request.result;
          completed++;
          if (completed === keys.length) resolve();
        };
        request.onerror = () => {
          completed++;
          if (completed === keys.length) resolve();
        };
      }
    });
  } catch (e) {
    console.error("IndexedDB preload error:", e);
  }
}
