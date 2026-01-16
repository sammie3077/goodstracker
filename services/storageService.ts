
import { GoodsItem, ProxyService, Work, GalleryItem, ConditionStatus } from '../types';
import { DB, STORES } from './db';
import { ImageService } from './imageService';

const LEGACY_STORAGE_KEYS = {
  ITEMS: 'goods_tracker_items',
  GALLERY: 'goods_tracker_gallery',
  WORKS: 'goods_tracker_works',
  PROXIES: 'goods_tracker_proxies',
};

const THEME_KEY = 'app_theme';

// Initial Data Seeding
const DEFAULT_CATEGORIES = ['徽章', '立牌', '紙片'];

export const StorageService = {
  // --- Initialization & Migration ---
  init: async (): Promise<boolean> => {
    try {
      await DB.init();

      // Check if DB is empty, if so, try to migrate from localStorage
      const works = await DB.getAll<Work>(STORES.WORKS);
      if (works.length === 0) {
        // Attempt Migration
        const legacyItemsStr = localStorage.getItem(LEGACY_STORAGE_KEYS.ITEMS);
        const legacyGalleryStr = localStorage.getItem(LEGACY_STORAGE_KEYS.GALLERY);
        const legacyWorksStr = localStorage.getItem(LEGACY_STORAGE_KEYS.WORKS);
        const legacyProxiesStr = localStorage.getItem(LEGACY_STORAGE_KEYS.PROXIES);

        if (legacyWorksStr || legacyItemsStr) {
          console.log('Migrating data from localStorage to IndexedDB...');
          if (legacyWorksStr) await DB.bulkPut(STORES.WORKS, JSON.parse(legacyWorksStr));
          if (legacyItemsStr) await DB.bulkPut(STORES.ITEMS, JSON.parse(legacyItemsStr));
          if (legacyGalleryStr) await DB.bulkPut(STORES.GALLERY, JSON.parse(legacyGalleryStr));
          if (legacyProxiesStr) await DB.bulkPut(STORES.PROXIES, JSON.parse(legacyProxiesStr));

          // Clear legacy data to free up space, but keep theme
          // Note: Comment this out if you want to keep a backup in localStorage for a while
          localStorage.removeItem(LEGACY_STORAGE_KEYS.ITEMS);
          localStorage.removeItem(LEGACY_STORAGE_KEYS.GALLERY);
          localStorage.removeItem(LEGACY_STORAGE_KEYS.WORKS);
          localStorage.removeItem(LEGACY_STORAGE_KEYS.PROXIES);

          return true; // Migrated
        }
      }

      // Migrate ConditionStatus from OPENED_CHECKED to CHECKED
      const migrationKey = 'condition_status_migrated_v1';
      if (!localStorage.getItem(migrationKey)) {
        console.log('Migrating ConditionStatus from OPENED_CHECKED to CHECKED...');
        const items = await DB.getAll<GoodsItem>(STORES.ITEMS);
        let migratedCount = 0;

        for (const item of items) {
          // Legacy migration: check for old enum value as string
          const legacyCondition = item.condition as string;
          if (legacyCondition === 'OPENED_CHECKED' || legacyCondition === '僅拆檢') {
            item.condition = ConditionStatus.CHECKED;
            await DB.put(STORES.ITEMS, item);
            migratedCount++;
          }
        }

        localStorage.setItem(migrationKey, 'true');
        if (migratedCount > 0) {
          console.log(`Migrated ${migratedCount} items with OPENED_CHECKED status`);
        }
      }

      // Migrate base64 images to Blob storage (v2)
      const imageMigrationKey = 'images_migrated_to_blob_v2';
      if (!localStorage.getItem(imageMigrationKey)) {
        console.log('Migrating images from base64 to Blob storage...');

        // Migrate GoodsItems
        const items = await DB.getAll<GoodsItem>(STORES.ITEMS);
        let itemsMigratedCount = 0;

        for (const item of items) {
          if (item.image && !item.imageId) {
            try {
              const imageId = await ImageService.migrateBase64ToBlob(item.image);
              item.imageId = imageId;
              delete item.image; // Remove old base64 field
              await DB.put(STORES.ITEMS, item);
              itemsMigratedCount++;
            } catch (error) {
              console.error(`Failed to migrate image for item ${item.id}:`, error);
            }
          }
        }

        // Migrate GalleryItems
        const galleryItems = await DB.getAll<GalleryItem>(STORES.GALLERY);
        let galleryMigratedCount = 0;

        for (const item of galleryItems) {
          if (item.image && !item.imageId) {
            try {
              const imageId = await ImageService.migrateBase64ToBlob(item.image);
              item.imageId = imageId;
              delete item.image; // Remove old base64 field
              await DB.put(STORES.GALLERY, item);
              galleryMigratedCount++;
            } catch (error) {
              console.error(`Failed to migrate image for gallery item ${item.id}:`, error);
            }
          }
        }

        localStorage.setItem(imageMigrationKey, 'true');
        console.log(`Migrated ${itemsMigratedCount} goods items and ${galleryMigratedCount} gallery items to Blob storage`);
      }

      return false; // No migration needed
    } catch (e) {
      console.error("DB Init failed", e);
      return false;
    }
  },

  // --- Backup & Restore ---
  getAllData: async () => {
    // Ensure DB is initialized before reading
    await DB.init();

    const [items, gallery, works, proxies, images] = await Promise.all([
      DB.getAll<GoodsItem>(STORES.ITEMS),
      DB.getAll<GalleryItem>(STORES.GALLERY),
      DB.getAll<Work>(STORES.WORKS),
      DB.getAll<ProxyService>(STORES.PROXIES),
      DB.getAll(STORES.IMAGES),
    ]);

    // Convert image Blobs to base64 for JSON serialization
    const imagesForBackup = await Promise.all(
      images.map(async (imageData: any) => {
        try {
          const base64 = await ImageService.getImageAsBase64(imageData.id);
          return {
            id: imageData.id,
            base64: base64,
            createdAt: imageData.createdAt
          };
        } catch (error) {
          console.error(`Failed to backup image ${imageData.id}:`, error);
          return null;
        }
      })
    );

    return {
      items,
      gallery,
      works,
      proxies,
      images: imagesForBackup.filter(img => img !== null), // Remove failed conversions
      theme: localStorage.getItem(THEME_KEY) || 'yellow',
      backupDate: new Date().toISOString(),
    };
  },

  restoreData: async (data: any): Promise<boolean> => {
    if (!data) return false;
    try {
      await DB.clear(STORES.ITEMS);
      await DB.clear(STORES.GALLERY);
      await DB.clear(STORES.WORKS);
      await DB.clear(STORES.PROXIES);
      await DB.clear(STORES.IMAGES);

      if (Array.isArray(data.items)) await DB.bulkPut(STORES.ITEMS, data.items);
      if (Array.isArray(data.gallery)) await DB.bulkPut(STORES.GALLERY, data.gallery);
      if (Array.isArray(data.works)) await DB.bulkPut(STORES.WORKS, data.works);
      if (Array.isArray(data.proxies)) await DB.bulkPut(STORES.PROXIES, data.proxies);

      // Restore images: convert base64 back to Blob
      if (Array.isArray(data.images)) {
        for (const imageBackup of data.images) {
          try {
            if (imageBackup.base64 && imageBackup.id) {
              // Use ImageService to save the base64 as Blob with the original ID
              await ImageService.saveImageWithId(imageBackup.id, imageBackup.base64, imageBackup.createdAt);
            }
          } catch (error) {
            console.error(`Failed to restore image ${imageBackup.id}:`, error);
            // Continue with other images even if one fails
          }
        }
      }

      if (typeof data.theme === 'string') localStorage.setItem(THEME_KEY, data.theme);

      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  },

  // --- Items (Goods) ---
  getItems: async (): Promise<GoodsItem[]> => {
    return DB.getAll<GoodsItem>(STORES.ITEMS);
  },
  addItem: async (item: GoodsItem) => {
    await DB.add(STORES.ITEMS, item);
  },
  updateItem: async (item: GoodsItem) => {
    await DB.put(STORES.ITEMS, item);
  },
  deleteItem: async (id: string) => {
    // Get the item first to check for associated image
    const items = await StorageService.getItems();
    const item = items.find(i => i.id === id);

    // Delete associated image if exists
    if (item?.imageId) {
      await ImageService.deleteImage(item.imageId);
    }

    await DB.delete(STORES.ITEMS, id);
  },
  bulkUpdateItems: async (items: GoodsItem[]) => {
    await DB.bulkPut(STORES.ITEMS, items);
  },

  // --- Gallery Items ---
  getGalleryItems: async (): Promise<GalleryItem[]> => {
    return DB.getAll<GalleryItem>(STORES.GALLERY);
  },
  addGalleryItem: async (item: GalleryItem) => {
    await DB.add(STORES.GALLERY, item);
  },
  updateGalleryItem: async (item: GalleryItem) => {
    await DB.put(STORES.GALLERY, item);
  },
  deleteGalleryItem: async (id: string) => {
    // Get the gallery item first to check for associated image
    const galleryItems = await StorageService.getGalleryItems();
    const item = galleryItems.find(i => i.id === id);

    // Delete associated image if exists
    if (item?.imageId) {
      await ImageService.deleteImage(item.imageId);
    }

    await DB.delete(STORES.GALLERY, id);
  },
  bulkUpdateGalleryItems: async (items: GalleryItem[]) => {
    await DB.bulkPut(STORES.GALLERY, items);
  },

  // --- Works & Categories ---
  getWorks: async (): Promise<Work[]> => {
    return DB.getAll<Work>(STORES.WORKS);
  },
  addWork: async (name: string): Promise<Work> => {
    const newWork: Work = {
      id: crypto.randomUUID(),
      name,
      categories: DEFAULT_CATEGORIES.map(c => ({ id: crypto.randomUUID(), name: c })),
    };
    await DB.add(STORES.WORKS, newWork);
    return newWork;
  },
  updateWork: async (workId: string, name: string) => {
    const works = await StorageService.getWorks();
    const work = works.find(w => w.id === workId);
    if (work) {
      work.name = name;
      await DB.put(STORES.WORKS, work);
    }
  },
  deleteWork: async (workId: string) => {
    // 1. Get all items to delete and their images
    const items = await StorageService.getItems();
    const itemsToDelete = items.filter(i => i.workId === workId);

    const galleryItems = await StorageService.getGalleryItems();
    const galleryToDelete = galleryItems.filter(i => i.workId === workId);

    // 2. Delete all associated images first
    for (const item of itemsToDelete) {
      if (item.imageId) {
        await ImageService.deleteImage(item.imageId);
      }
    }

    for (const item of galleryToDelete) {
      if (item.imageId) {
        await ImageService.deleteImage(item.imageId);
      }
    }

    // 3. Delete the items
    for (const item of itemsToDelete) {
      await DB.delete(STORES.ITEMS, item.id);
    }

    for (const item of galleryToDelete) {
      await DB.delete(STORES.GALLERY, item.id);
    }

    // 4. Delete the work itself
    await DB.delete(STORES.WORKS, workId);
  },
  addCategoryToWork: async (workId: string, categoryName: string) => {
    const works = await StorageService.getWorks();
    const work = works.find(w => w.id === workId);
    if (work) {
      work.categories.push({ id: crypto.randomUUID(), name: categoryName });
      await DB.put(STORES.WORKS, work);
    }
  },
  updateCategory: async (workId: string, categoryId: string, name: string) => {
    const works = await StorageService.getWorks();
    const work = works.find(w => w.id === workId);
    if (work) {
      const cat = work.categories.find(c => c.id === categoryId);
      if (cat) {
        cat.name = name;
        await DB.put(STORES.WORKS, work);
      }
    }
  },
  deleteCategory: async (workId: string, categoryId: string) => {
    // 1. Get all items to delete and their images
    const items = await StorageService.getItems();
    const itemsToDelete = items.filter(i => i.categoryId === categoryId);

    // 2. Delete all associated images first
    for (const item of itemsToDelete) {
      if (item.imageId) {
        await ImageService.deleteImage(item.imageId);
      }
    }

    // 3. Delete the items
    for (const item of itemsToDelete) {
      await DB.delete(STORES.ITEMS, item.id);
    }

    // 4. Remove category from work
    const works = await StorageService.getWorks();
    const work = works.find(w => w.id === workId);
    if (work) {
      work.categories = work.categories.filter(c => c.id !== categoryId);
      await DB.put(STORES.WORKS, work);
    }
  },
  bulkUpdateWorks: async (works: Work[]) => {
    await DB.bulkPut(STORES.WORKS, works);
  },

  // --- Proxies ---
  getProxies: async (): Promise<ProxyService[]> => {
    return DB.getAll<ProxyService>(STORES.PROXIES);
  },
  addProxy: async (proxy: ProxyService) => {
    await DB.add(STORES.PROXIES, proxy);
  },
  updateProxy: async (proxy: ProxyService) => {
    await DB.put(STORES.PROXIES, proxy);
  },
  deleteProxy: async (id: string) => {
    await DB.delete(STORES.PROXIES, id);
  },
};
