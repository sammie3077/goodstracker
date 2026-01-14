import { useEffect, useState } from 'react';
import { ImageService } from '../services/imageService';

/**
 * Hook to load image from imageId
 * Returns the image URL for display
 */
export const useImage = (imageId: string | undefined) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageId) {
      setImageUrl(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    ImageService.getImage(imageId)
      .then((url) => {
        if (isMounted) {
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
    return () => {
      isMounted = false;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageId]);

  return { imageUrl, isLoading };
};
