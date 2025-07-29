
import { PersonalInfo, ProfileCache } from './types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'profile_cache';

export const getCachedProfile = (): PersonalInfo | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsedCache: ProfileCache = JSON.parse(cached);
      const now = Date.now();
      if (now - parsedCache.timestamp < parsedCache.expiresIn) {
        return parsedCache.data;
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  } catch (error) {
    console.warn('Failed to read profile cache:', error);
    localStorage.removeItem(CACHE_KEY);
  }
  return null;
};

export const setCachedProfile = (profile: PersonalInfo): void => {
  try {
    const cacheData: ProfileCache = {
      data: profile,
      timestamp: Date.now(),
      expiresIn: CACHE_DURATION
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache profile data:', error);
  }
};

export const clearProfileCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
};
