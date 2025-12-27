'use client';

import { useState, useEffect, useCallback } from 'react';

export function useImagePreload(src: string | null) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoaded(false);
      setError(false);
      return;
    }

    setLoaded(false);
    setError(false);

    const img = new Image();
    
    img.onload = () => {
      setLoaded(true);
      setError(false);
    };
    
    img.onerror = () => {
      setLoaded(false);
      setError(true);
    };
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loaded, error };
}

export function useMultipleImagePreload(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((url: string) => {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, url]));
        resolve(true);
      };
      
      img.onerror = () => {
        setErrorImages(prev => new Set([...prev, url]));
        resolve(false);
      };
      
      img.src = url;
    });
  }, []);

  useEffect(() => {
    if (urls.length === 0) return;

    // Reset states
    setLoadedImages(new Set());
    setErrorImages(new Set());

    // Preload all images
    Promise.allSettled(urls.map(preloadImage));
  }, [urls, preloadImage]);

  return { 
    loadedImages, 
    errorImages,
    isLoaded: (url: string) => loadedImages.has(url),
    hasError: (url: string) => errorImages.has(url)
  };
}