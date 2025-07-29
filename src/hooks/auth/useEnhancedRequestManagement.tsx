
import { useRef, useCallback } from 'react';

interface RequestOptions {
  key: string;
  timeout?: number;
  allowRetry?: boolean;
  maxRetries?: number;
}

export const useEnhancedRequestManagement = () => {
  const activeRequests = useRef<Map<string, Promise<any>>>(new Map());
  const requestAttempts = useRef<Map<string, number>>(new Map());
  const lastRequestTime = useRef<Map<string, number>>(new Map());

  const executeRequest = useCallback(async <T,>(
    requestFn: () => Promise<T>,
    options: RequestOptions
  ): Promise<T> => {
    const { key, timeout = 35000, allowRetry = true, maxRetries = 2 } = options;
    const now = Date.now();
    const lastRequest = lastRequestTime.current.get(key);
    const attempts = requestAttempts.current.get(key) || 0;

    // Check if we're at max retries
    if (attempts >= maxRetries && !allowRetry) {
      throw new Error('Maximum retry attempts reached');
    }

    // Allow retry if enough time has passed (3 seconds) or if explicitly allowed
    if (allowRetry && lastRequest && (now - lastRequest) < 3000 && attempts > 0) {
      console.log('🔄 Request too recent, waiting for cooldown:', key);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check if request is already in progress (prevent true duplicates)
    const existingRequest = activeRequests.current.get(key);
    if (existingRequest && lastRequest && (now - lastRequest) < 1000) {
      console.log('🔄 Deduplicating identical request for key:', key);
      return existingRequest;
    }

    // Clear any existing request if we're allowing retry
    if (allowRetry) {
      activeRequests.current.delete(key);
    }

    // Record request time and increment attempts
    lastRequestTime.current.set(key, now);
    requestAttempts.current.set(key, attempts + 1);

    console.log(`🚀 Executing request ${attempts + 1}/${maxRetries + 1} for key:`, key);

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
      
      // Reset attempts on success
      requestAttempts.current.delete(key);
      
      return result;
    } catch (error) {
      console.log('❌ Request failed for key:', key, error);
      
      // Don't increment attempts for certain types of errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already registered') || 
          errorMessage.includes('Invalid login credentials')) {
        requestAttempts.current.delete(key);
      }
      
      throw error;
    } finally {
      // Clean up completed request after a short delay
      setTimeout(() => {
        activeRequests.current.delete(key);
      }, 2000);
    }
  }, []);

  const clearRequest = useCallback((key: string) => {
    activeRequests.current.delete(key);
    requestAttempts.current.delete(key);
    lastRequestTime.current.delete(key);
    console.log('🧹 Cleared request data for key:', key);
  }, []);

  const clearAllRequests = useCallback(() => {
    activeRequests.current.clear();
    requestAttempts.current.clear();
    lastRequestTime.current.clear();
    console.log('🧹 Cleared all request data');
  }, []);

  const getRequestStatus = useCallback((key: string) => {
    return {
      isActive: activeRequests.current.has(key),
      attempts: requestAttempts.current.get(key) || 0,
      lastRequestTime: lastRequestTime.current.get(key)
    };
  }, []);

  return { 
    executeRequest, 
    clearRequest, 
    clearAllRequests, 
    getRequestStatus 
  };
};
