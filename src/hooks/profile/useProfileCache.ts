
import { useCallback } from 'react';
import { PersonalInfo, ProfileCache } from './types';

const CACHE_KEY = 'profile_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProfileCache = () => {
  const loadFromCache = useCallback((): PersonalInfo | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: ProfileCache = JSON.parse(cached);
      const now = Date.now();
      
      if (now > parsedCache.timestamp + parsedCache.expiresIn) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.warn('Error loading profile cache:', error);
      return null;
    }
  }, []);

  const saveToCache = useCallback((data: PersonalInfo) => {
    try {
      const cacheData: ProfileCache = {
        data,
        timestamp: Date.now(),
        expiresIn: CACHE_DURATION
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error saving profile cache:', error);
    }
  }, []);

  return {
    loadFromCache,
    saveToCache
  };
};
