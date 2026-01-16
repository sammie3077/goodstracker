import { DB, STORES } from './db';

export interface ImageData {
  id: string;
  blob: Blob;
  createdAt: number;
}

export const ImageService = {
  /**
   * Save a base64 image as Blob and return the image ID
   */
  saveImage: async (base64: string): Promise<string> => {
    try {
      // Generate unique ID
      const imageId = crypto.randomUUID();

      // Convert base64 to Blob
      const blob = base64ToBlob(base64);

      // Save to IndexedDB
      const imageData: ImageData = {
        id: imageId,
        blob,
        createdAt: Date.now()
      };

      await DB.put(STORES.IMAGES, imageData);

      return imageId;
    } catch (error: any) {
      console.error('Failed to save image:', error);

      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        const quotaError = new Error('儲存空間不足，請刪除一些舊圖片或清理瀏覽器快取');
        quotaError.name = 'QuotaExceededError';
        throw quotaError;
      }

      throw error;
    }
  },

  /**
   * Save a base64 image as Blob with a specific ID (used for restore)
   */
  saveImageWithId: async (imageId: string, base64: string, createdAt?: number): Promise<void> => {
    try {
      // Convert base64 to Blob
      const blob = base64ToBlob(base64);

      // Save to IndexedDB with specified ID
      const imageData: ImageData = {
        id: imageId,
        blob,
        createdAt: createdAt || Date.now()
      };

      await DB.put(STORES.IMAGES, imageData);
    } catch (error: any) {
      console.error('Failed to save image with ID:', error);

      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        const quotaError = new Error('儲存空間不足，請刪除一些舊圖片或清理瀏覽器快取');
        quotaError.name = 'QuotaExceededError';
        throw quotaError;
      }

      throw error;
    }
  },

  /**
   * Get image Blob by ID and convert to base64 URL for display
   */
  getImage: async (imageId: string): Promise<string | null> => {
    try {
      const db = await DB.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.IMAGES, 'readonly');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.get(imageId);

        request.onsuccess = () => {
          const imageData = request.result as ImageData | undefined;
          if (imageData && imageData.blob) {
            // Convert Blob to Object URL for display
            const url = URL.createObjectURL(imageData.blob);
            resolve(url);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('Failed to get image:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Failed to get image:', error);
      return null;
    }
  },

  /**
   * Get image Blob by ID as base64 string
   */
  getImageAsBase64: async (imageId: string): Promise<string | null> => {
    try {
      const db = await DB.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.IMAGES, 'readonly');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.get(imageId);

        request.onsuccess = async () => {
          const imageData = request.result as ImageData | undefined;
          if (imageData && imageData.blob) {
            const base64 = await blobToBase64(imageData.blob);
            resolve(base64);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('Failed to get image:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Failed to get image:', error);
      return null;
    }
  },

  /**
   * Delete an image by ID
   */
  deleteImage: async (imageId: string): Promise<void> => {
    try {
      await DB.delete(STORES.IMAGES, imageId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  },

  /**
   * Update an existing image (delete old, save new)
   */
  updateImage: async (oldImageId: string | undefined, newBase64: string): Promise<string> => {
    // Delete old image if exists
    if (oldImageId) {
      await ImageService.deleteImage(oldImageId);
    }

    // Save new image
    return await ImageService.saveImage(newBase64);
  },

  /**
   * Migrate base64 string to Blob storage
   * Returns the new image ID
   */
  migrateBase64ToBlob: async (base64: string): Promise<string> => {
    return await ImageService.saveImage(base64);
  }
};

// Helper functions
function base64ToBlob(base64: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.split(',')[1] || base64;

  // Get mime type
  const mimeMatch = base64.match(/^data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

  // Convert base64 to binary
  const binary = atob(base64Data);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mimeType });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
