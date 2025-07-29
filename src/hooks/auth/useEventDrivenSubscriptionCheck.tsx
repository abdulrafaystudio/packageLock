
import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface EventDrivenConfig {
  triggerPaths: string[];
  sessionKey: string;
  checkOnce: boolean;
}

export const useEventDrivenSubscriptionCheck = (
  config: EventDrivenConfig = {
    triggerPaths: ['/companies', '/investors', '/deals'],
    sessionKey: 'subscription_sensitive_pages_checked',
    checkOnce: true
  }
) => {
  const location = useLocation();
  const { user, checkSubscription } = useAuth();
  const hasCheckedThisSession = useRef<Set<string>>(new Set());

  // Load session state
  useEffect(() => {
    try {
      const sessionData = sessionStorage.getItem(config.sessionKey);
      if (sessionData) {
        const checkedPaths = JSON.parse(sessionData);
        hasCheckedThisSession.current = new Set(checkedPaths);
      }
    } catch (error) {
      console.error('Failed to load session check data:', error);
    }
  }, [config.sessionKey]);

  // Save session state
  const saveSessionState = useCallback(() => {
    try {
      const checkedPaths = Array.from(hasCheckedThisSession.current);
      sessionStorage.setItem(config.sessionKey, JSON.stringify(checkedPaths));
    } catch (error) {
      console.error('Failed to save session check data:', error);
    }
  }, [config.sessionKey]);

  // Check subscription for sensitive pages
  const checkForSensitivePages = useCallback(() => {
    if (!user) return;

    const currentPath = location.pathname;
    const shouldTrigger = config.triggerPaths.some(path => currentPath.startsWith(path));
    
    if (!shouldTrigger) return;

    // If checkOnce is true, only check once per session per path
    if (config.checkOnce && hasCheckedThisSession.current.has(currentPath)) {
      console.log(`📋 Already checked subscription for ${currentPath} this session`);
      return;
    }

    console.log(`🔍 Checking subscription for sensitive page: ${currentPath}`);
    checkSubscription();

    // Mark as checked
    hasCheckedThisSession.current.add(currentPath);
    saveSessionState();
  }, [user, location.pathname, config, checkSubscription, saveSessionState]);

  // Trigger check when navigating to sensitive pages
  useEffect(() => {
    checkForSensitivePages();
  }, [checkForSensitivePages]);

  // Clear session data on user change
  useEffect(() => {
    if (!user) {
      hasCheckedThisSession.current.clear();
      sessionStorage.removeItem(config.sessionKey);
    }
  }, [user, config.sessionKey]);

  return {
    forceCheck: () => {
      hasCheckedThisSession.current.clear();
      checkForSensitivePages();
    },
    clearSession: () => {
      hasCheckedThisSession.current.clear();
      sessionStorage.removeItem(config.sessionKey);
    }
  };
};
