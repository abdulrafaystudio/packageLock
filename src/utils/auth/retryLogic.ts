
// Enhanced retry logic for authentication operations
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

export const wait = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  return Math.min(delay, config.maxDelay);
};

export const shouldRetry = (error: any, attempt: number, config: RetryConfig): boolean => {
  if (attempt >= config.maxRetries) return false;
  
  // Don't retry on validation errors or user input errors
  if (error?.message?.includes('Invalid login credentials')) return false;
  if (error?.message?.includes('already registered')) return false;
  if (error?.status === 422) return false; // Unprocessable Entity
  
  // Retry on network errors, timeouts, and server errors
  const retryableErrors = [
    'network',
    'timeout',
    'rate limit',
    'context deadline exceeded',
    'request_timeout',
    'Processing this request timed out',
    'Failed to fetch'
  ];
  
  const errorMessage = (error?.message || '').toLowerCase();
  const isRetryable = retryableErrors.some(errType => errorMessage.includes(errType));
  const isServerError = error?.status >= 500 || error?.status === 429;
  
  return isRetryable || isServerError;
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: string = 'operation'
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`🔄 ${context} - Attempt ${attempt + 1}/${config.maxRetries + 1}`);
      const result = await operation();
      
      if (attempt > 0) {
        console.log(`✅ ${context} - Succeeded after ${attempt + 1} attempts`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ ${context} - Attempt ${attempt + 1} failed:`, error);
      
      if (!shouldRetry(error, attempt, config)) {
        console.log(`🚫 ${context} - Not retrying (attempt ${attempt + 1})`);
        break;
      }
      
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config);
        console.log(`⏳ ${context} - Waiting ${delay}ms before retry ${attempt + 2}`);
        await wait(delay);
      }
    }
  }
  
  throw lastError;
};
