
import { useCallback } from 'react';

interface SubmissionAttempt {
  email: string;
  timestamp: number;
  action: 'signup' | 'signin' | 'resend';
}

export const useSmartRateLimit = () => {
  const STORAGE_KEY = 'auth_submissions';
  const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
  const MAX_ATTEMPTS_PER_EMAIL = 3;
  const BACKOFF_MULTIPLIER = 2;

  const getStoredAttempts = (): SubmissionAttempt[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveAttempts = (attempts: SubmissionAttempt[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    } catch {
      // Ignore storage errors
    }
  };

  const cleanOldAttempts = (attempts: SubmissionAttempt[]): SubmissionAttempt[] => {
    const now = Date.now();
    return attempts.filter(attempt => now - attempt.timestamp < RATE_LIMIT_WINDOW);
  };

  const checkRateLimit = useCallback((email: string, action: 'signup' | 'signin' | 'resend') => {
    const attempts = cleanOldAttempts(getStoredAttempts());
    const emailAttempts = attempts.filter(attempt => 
      attempt.email.toLowerCase() === email.toLowerCase() && 
      attempt.action === action
    );

    if (emailAttempts.length >= MAX_ATTEMPTS_PER_EMAIL) {
      const lastAttempt = emailAttempts[emailAttempts.length - 1];
      const timeSinceLastAttempt = Date.now() - lastAttempt.timestamp;
      const backoffTime = Math.min(
        Math.pow(BACKOFF_MULTIPLIER, emailAttempts.length - 1) * 60000, // Start with 1 minute, exponential backoff
        RATE_LIMIT_WINDOW // Cap at 5 minutes
      );
      
      if (timeSinceLastAttempt < backoffTime) {
        const remainingTime = Math.ceil((backoffTime - timeSinceLastAttempt) / 1000);
        return {
          allowed: false,
          remainingTime,
          message: `Please wait ${Math.ceil(remainingTime / 60)} minute${Math.ceil(remainingTime / 60) !== 1 ? 's' : ''} before trying again for this email.`
        };
      }
    }

    return { allowed: true };
  }, []);

  const recordAttempt = useCallback((email: string, action: 'signup' | 'signin' | 'resend') => {
    const attempts = cleanOldAttempts(getStoredAttempts());
    attempts.push({
      email: email.toLowerCase(),
      timestamp: Date.now(),
      action
    });
    saveAttempts(attempts);
  }, []);

  const clearAttempts = useCallback((email?: string) => {
    if (email) {
      const attempts = getStoredAttempts();
      const filtered = attempts.filter(attempt => 
        attempt.email.toLowerCase() !== email.toLowerCase()
      );
      saveAttempts(filtered);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    checkRateLimit,
    recordAttempt,
    clearAttempts
  };
};
