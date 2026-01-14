
const DB_NAME = 'GoodsTrackerDB';
const DB_VERSION = 2; // Upgraded for Blob storage

export const STORES = {
  ITEMS: 'items',
  GALLERY: 'gallery',
  WORKS: 'works',
  PROXIES: 'proxies',
  IMAGES: 'images' // New store for Blob storage
};

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Version 1: Create Object Stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.ITEMS)) {
        db.createObjectStore(STORES.ITEMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.GALLERY)) {
        db.createObjectStore(STORES.GALLERY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.WORKS)) {
        db.createObjectStore(STORES.WORKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PROXIES)) {
        db.createObjectStore(STORES.PROXIES, { keyPath: 'id' });
      }

      // Version 2: Add images store for Blob storage
      if (oldVersion < 2 && !db.objectStoreNames.contains(STORES.IMAGES)) {
        db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

// Generic Database Operations
export const DB = {
  init: () => openDB(),

  getAll: async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  add: async <T>(storeName: string, item: T): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  put: async <T>(storeName: string, item: T): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  delete: async (storeName: string, id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  clear: async (storeName: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Bulk operation for migration/restore
  bulkPut: async <T>(storeName: string, items: T[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      items.forEach(item => store.put(item));
    });
  }
};
