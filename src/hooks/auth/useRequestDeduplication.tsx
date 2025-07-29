
import { useRef, useCallback } from 'react';

interface RequestOptions {
  key: string;
  timeout?: number;
  allowRetry?: boolean;
}

export const useRequestDeduplication = () => {
  const activeRequests = useRef<Map<string, Promise<any>>>(new Map());
  const lastRequestTime = useRef<Map<string, number>>(new Map());

  const executeRequest = useCallback(async <T,>(
    requestFn: () => Promise<T>,
    options: RequestOptions
  ): Promise<T> => {
    const { key, timeout = 30000, allowRetry = true } = options;
    const now = Date.now();
    const lastRequest = lastRequestTime.current.get(key);

    // Check for minimum interval between requests (30 seconds for same request)
    if (lastRequest && (now - lastRequest) < 30000) {
      console.log('⏸️ Skipping check, last check was', Math.floor((now - lastRequest) / 1000) + 's ago');
      const existingRequest = activeRequests.current.get(key);
      if (existingRequest) {
        return existingRequest;
      }
      // If no existing request but within interval, throw an error to prevent spam
      throw new Error('Request rate limited - please wait before trying again');
    }

    // Check if request is already in progress
    const existingRequest = activeRequests.current.get(key);
    if (existingRequest) {
      console.log('🔄 Deduplicating request for key:', key);
      return existingRequest;
    }

    // Clear any existing request if we're allowing retry
    if (allowRetry) {
      activeRequests.current.delete(key);
    }

    // Record request time
    lastRequestTime.current.set(key, now);

    // Create new request with timeout
    const requestPromise = Promise.race([
      requestFn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => {
          console.log('⏰ Request timeout for key:', key);
          reject(new Error('Request timeout'));
        }, timeout)
      )
    ]);

    // Store the request
    activeRequests.current.set(key, requestPromise);

    try {
      const result = await requestPromise;
      console.log('✅ Request completed successfully for key:', key);
      return result;
    } catch (error) {
      console.log('❌ Request failed for key:', key, error);
      throw error;
    } finally {
      // Clean up completed request after a short delay to prevent immediate duplicates
      setTimeout(() => {
        activeRequests.current.delete(key);
      }, 1000);
    }
  }, []);

  const clearRequest = useCallback((key: string) => {
    activeRequests.current.delete(key);
    lastRequestTime.current.delete(key);
  }, []);

  const clearAllRequests = useCallback(() => {
    activeRequests.current.clear();
    lastRequestTime.current.clear();
  }, []);

  return { executeRequest, clearRequest, clearAllRequests };
};
