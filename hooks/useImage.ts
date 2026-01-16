import { useEffect, useState } from 'react';
import { ImageService } from '../services/imageService';

/**
 * Hook to load image from imageId with optional cache support
 * Returns the image URL for display
 *
 * @param imageId - The ID of the image to load
 * @param cachedUrl - Optional pre-cached URL to use instead of loading
 */
export const useImage = (imageId: string | undefined, cachedUrl?: string | null) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageId) {
      setImageUrl(null);
      return;
    }

    // Use cached URL if provided
    if (cachedUrl !== undefined) {
      setImageUrl(cachedUrl);
      setIsLoading(false);
      return;
    }

    // Load from IndexedDB
    let isMounted = true;
    let objectUrl: string | null = null;
    setIsLoading(true);

    ImageService.getImage(imageId)
      .then((url) => {
        if (isMounted && url) {
          objectUrl = url;
          setImageUrl(url);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to load image:', error);
        if (isMounted) {
          setImageUrl(null);
          setIsLoading(false);
        }
      });

    // Cleanup: revoke object URL when component unmounts or imageId changes
    // Note: Don't revoke if using cached URL
    return () => {
      isMounted = false;
      if (objectUrl && cachedUrl === undefined) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId, cachedUrl]);

  return { imageUrl, isLoading };
};
