
import { GoodsItem, ProxyService, Work, Category } from '../types';

const STORAGE_KEYS = {
  ITEMS: 'goods_tracker_items',
  WORKS: 'goods_tracker_works',
  PROXIES: 'goods_tracker_proxies',
  THEME: 'app_theme', // Include theme in backup
};

// Initial Data Seeding
const DEFAULT_CATEGORIES = ['徽章', '立牌', '紙片'];

export const StorageService = {
  // --- Backup & Restore ---
  getAllData: () => {
    return {
      items: StorageService.getItems(),
      works: StorageService.getWorks(),
      proxies: StorageService.getProxies(),
      theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'yellow',
      backupDate: new Date().toISOString(),
    };
  },

  restoreData: (data: any) => {
    if (!data) return false;
    try {
      if (Array.isArray(data.items)) StorageService.saveItems(data.items);
      if (Array.isArray(data.works)) StorageService.saveWorks(data.works);
      if (Array.isArray(data.proxies)) StorageService.saveProxies(data.proxies);
      if (typeof data.theme === 'string') localStorage.setItem(STORAGE_KEYS.THEME, data.theme);
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  },

  // --- Items ---
  getItems: (): GoodsItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load items", e);
      return [];
    }
  },
  saveItems: (items: GoodsItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save items (likely quota exceeded)", e);
      throw e;
    }
  },
  addItem: (item: GoodsItem) => {
    const items = StorageService.getItems();
    items.push(item);
    StorageService.saveItems(items);
  },
  updateItem: (updatedItem: GoodsItem) => {
    const items = StorageService.getItems();
    const index = items.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      items[index] = updatedItem;
      StorageService.saveItems(items);
    }
  },
  deleteItem: (id: string) => {
    const items = StorageService.getItems();
    const newItems = items.filter(i => i.id !== id);
    StorageService.saveItems(newItems);
  },

  // --- Works & Categories ---
  getWorks: (): Work[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  saveWorks: (works: Work[]) => {
    localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(works));
  },
  addWork: (name: string): Work => {
    const works = StorageService.getWorks();
    const newWork: Work = {
      id: crypto.randomUUID(),
      name,
      categories: DEFAULT_CATEGORIES.map(c => ({ id: crypto.randomUUID(), name: c })),
    };
    works.push(newWork);
    StorageService.saveWorks(works);
    return newWork;
  },
  updateWork: (workId: string, name: string) => {
    const works = StorageService.getWorks();
    const work = works.find(w => w.id === workId);
    if (work) {
      work.name = name;
      StorageService.saveWorks(works);
    }
  },
  deleteWork: (workId: string) => {
    // 1. Delete the work
    const works = StorageService.getWorks();
    const newWorks = works.filter(w => w.id !== workId);
    StorageService.saveWorks(newWorks);

    // 2. Cascade delete items belonging to this work
    const items = StorageService.getItems();
    const newItems = items.filter(i => i.workId !== workId);
    StorageService.saveItems(newItems);
  },
  addCategoryToWork: (workId: string, categoryName: string) => {
    const works = StorageService.getWorks();
    const work = works.find(w => w.id === workId);
    if (work) {
      work.categories.push({ id: crypto.randomUUID(), name: categoryName });
      StorageService.saveWorks(works);
    }
  },
  updateCategory: (workId: string, categoryId: string, name: string) => {
    const works = StorageService.getWorks();
    const work = works.find(w => w.id === workId);
    if (work) {
      const cat = work.categories.find(c => c.id === categoryId);
      if (cat) {
        cat.name = name;
        StorageService.saveWorks(works);
      }
    }
  },
  deleteCategory: (workId: string, categoryId: string) => {
    // 1. Remove category from work
    const works = StorageService.getWorks();
    const work = works.find(w => w.id === workId);
    if (work) {
      work.categories = work.categories.filter(c => c.id !== categoryId);
      StorageService.saveWorks(works);
    }

    // 2. Cascade delete items belonging to this category
    const items = StorageService.getItems();
    const newItems = items.filter(i => i.categoryId !== categoryId);
    StorageService.saveItems(newItems);
  },

  // --- Proxies ---
  getProxies: (): ProxyService[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROXIES);
    return data ? JSON.parse(data) : [];
  },
  saveProxies: (proxies: ProxyService[]) => {
    localStorage.setItem(STORAGE_KEYS.PROXIES, JSON.stringify(proxies));
  },
  addProxy: (proxy: ProxyService) => {
    const proxies = StorageService.getProxies();
    proxies.push(proxy);
    StorageService.saveProxies(proxies);
  },
  updateProxy: (updatedProxy: ProxyService) => {
    const proxies = StorageService.getProxies();
    const index = proxies.findIndex(p => p.id === updatedProxy.id);
    if (index !== -1) {
      proxies[index] = updatedProxy;
      StorageService.saveProxies(proxies);
    }
  },
  deleteProxy: (id: string) => {
    const proxies = StorageService.getProxies();
    const newProxies = proxies.filter(p => p.id !== id);
    StorageService.saveProxies(newProxies);
  },
};
