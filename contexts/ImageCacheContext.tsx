import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { ImageService } from '../services/imageService';

interface ImageCacheContextType {
  getImage: (imageId: string | undefined) => string | null;
  preloadImages: (imageIds: (string | undefined)[]) => Promise<void>;
  clearCache: () => void;
  cacheSize: number;
}

const ImageCacheContext = createContext<ImageCacheContextType | undefined>(undefined);

export const ImageCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cache store: imageId -> blob URL
  const cacheRef = useRef<Map<string, string>>(new Map());
  const [cacheSize, setCacheSize] = useState(0);

  // Track loading promises to avoid duplicate requests
  const loadingRef = useRef<Map<string, Promise<string | null>>>(new Map());

  // Get image from cache or load it
  const getImage = useCallback((imageId: string | undefined): string | null => {
    if (!imageId) return null;

    // Return from cache if available
    if (cacheRef.current.has(imageId)) {
      return cacheRef.current.get(imageId)!;
    }

    return null;
  }, []);

  // Preload multiple images in batch
  const preloadImages = useCallback(async (imageIds: (string | undefined)[]) => {
    // Filter out undefined and already cached images
    const uniqueIds = Array.from(new Set(
      imageIds.filter((id): id is string => {
        return !!id && !cacheRef.current.has(id) && !loadingRef.current.has(id);
      })
    ));

    if (uniqueIds.length === 0) return;

    // Create loading promises for all images
    const loadingPromises = uniqueIds.map(async (imageId) => {
      // Check if already loading
      if (loadingRef.current.has(imageId)) {
        return loadingRef.current.get(imageId)!;
      }

      // Create new loading promise
      const loadPromise = ImageService.getImage(imageId)
        .then((url) => {
          if (url) {
            cacheRef.current.set(imageId, url);
          }
          return url;
        })
        .catch((error) => {
          console.error(`Failed to preload image ${imageId}:`, error);
          return null;
        })
        .finally(() => {
          // Remove from loading tracker
          loadingRef.current.delete(imageId);
        });

      loadingRef.current.set(imageId, loadPromise);
      return loadPromise;
    });

    // Wait for all images to load
    await Promise.all(loadingPromises);

    // Update cache size for debugging
    setCacheSize(cacheRef.current.size);
  }, []);

  // Clear cache and revoke all blob URLs
  const clearCache = useCallback(() => {
    // Revoke all blob URLs to free memory
    cacheRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    cacheRef.current.clear();
    loadingRef.current.clear();
    setCacheSize(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  const value: ImageCacheContextType = {
    getImage,
    preloadImages,
    clearCache,
    cacheSize,
  };

  return (
    <ImageCacheContext.Provider value={value}>
      {children}
    </ImageCacheContext.Provider>
  );
};

export const useImageCache = () => {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error('useImageCache must be used within ImageCacheProvider');
  }
  return context;
};
