
import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { PersonalInfo } from './types';
import { getPersonalInfoFromUser } from './profileUtils';

interface CentralizedProfileState {
  personalInfo: PersonalInfo;
  userProfile: any;
  isAdmin: boolean;
  loading: boolean;
  profileError: string | null;
  lastFetchTime: number;
  isEditing: boolean;
}

// Enhanced cache management for immediate updates
const CACHE_KEY_PREFIX = 'profile_cache_';
const PROFILE_CACHE_DURATION = 30000; // 30 seconds cache for faster updates
let globalProfileCache: { [userId: string]: { data: any; timestamp: number } } = {};
let pendingRequests: { [userId: string]: Promise<any> } = {};

// CRITICAL: Force cache clearing function
export const clearProfileCache = (userId?: string) => {
  if (userId) {
    delete globalProfileCache[userId];
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
  } else {
    globalProfileCache = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
  console.log('🗑️ Profile cache cleared', userId ? `for user ${userId}` : 'globally');
};

export const useCentralizedProfile = (user: User | null) => {
  const [state, setState] = useState<CentralizedProfileState>({
    personalInfo: {
      fullName: '',
      email: '',
      companyName: '',
      packageType: 'free'
    },
    userProfile: null,
    isAdmin: false,
    loading: true,
    profileError: null,
    lastFetchTime: 0,
    isEditing: false
  });

  const retryCountRef = useRef(0);
  const lastRequestTimeRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced profile fetch with aggressive cache busting for subscription updates
  const fetchProfileData = useCallback(async (userId: string, forceRefresh = false): Promise<any> => {
    const now = Date.now();
    
    // For subscription-related updates, always force refresh
    if (forceRefresh) {
      clearProfileCache(userId);
    }

    // Check cache first (shorter cache for subscription updates)
    const cached = globalProfileCache[userId];
    if (!forceRefresh && cached && now - cached.timestamp < PROFILE_CACHE_DURATION) {
      console.log('🎯 Using cached profile data');
      return cached.data;
    }

    // Check for pending request (deduplication)
    if (pendingRequests[userId]) {
      console.log('🔄 Waiting for existing profile request');
      return await pendingRequests[userId];
    }

    // Create new request with enhanced subscription data fetching
    const requestPromise = async () => {
      try {
        lastRequestTimeRef.current = now;
        
        console.log('🔍 Fetching fresh profile data for user:', userId);
        
        // ENHANCED: Fetch all subscription-related data in parallel
        const [profileResult, subscriberResult, adminResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(),
          supabase
            .from('subscribers')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle()
        ]);

        const { data: profileData, error: profileError } = profileResult;
        const { data: subscriberData, error: subscriberError } = subscriberResult;
        const { data: adminData, error: adminError } = adminResult;

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        const result = {
          profile: profileData,
          subscriber: subscriberData,
          isAdmin: !adminError && !!adminData,
          hasActiveSubscription: subscriberData?.subscribed && subscriberData?.subscription_status === 'active',
          subscriptionId: subscriberData?.stripe_subscription_id
        };

        // Cache the result with shorter duration for subscription data
        globalProfileCache[userId] = {
          data: result,
          timestamp: now
        };

        // Also cache in localStorage for persistence
        try {
          localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify({
            data: result,
            timestamp: now
          }));
        } catch (e) {
          console.warn('Failed to cache profile in localStorage:', e);
        }

        retryCountRef.current = 0; // Reset retry count on success
        return result;

      } catch (error: any) {
        console.error('💥 Error fetching profile data:', error);
        throw error;
      } finally {
        // Clean up pending request
        delete pendingRequests[userId];
      }
    };

    // Store and execute the request
    pendingRequests[userId] = requestPromise();
    return await pendingRequests[userId];
  }, []);

  // NEW: Fallback polling mechanism
  const startPolling = useCallback(() => {
    if (!user?.id || pollingIntervalRef.current) return;

    console.log('🔄 Starting fallback polling for profile updates');
    
    pollingIntervalRef.current = setInterval(() => {
      fetchProfileData(user.id, true).then((result) => {
        if (result) {
          const packageType = result.subscriber?.subscription_tier || 
                             result.profile?.package_type || 
                             'free';
          
          const profileInfo: PersonalInfo = {
            fullName: result.profile?.full_name || user.user_metadata?.full_name || '',
            email: result.profile?.email || user.email || '',
            companyName: result.profile?.company_name || user.user_metadata?.company_name || '',
            packageType: packageType as any
          };

          setState(prev => {
            // Only update if there are actual changes
            const hasChanges = JSON.stringify(prev.personalInfo) !== JSON.stringify(profileInfo) ||
                              JSON.stringify(prev.userProfile?.subscription_tier) !== JSON.stringify(result.subscriber?.subscription_tier);
            
            if (hasChanges) {
              console.log('📊 Polling detected profile changes, updating...');
              return {
                ...prev,
                personalInfo: profileInfo,
                userProfile: {
                  ...result.profile,
                  subscription_tier: result.subscriber?.subscription_tier,
                  subscription_status: result.subscriber?.subscription_status,
                  subscription_end: result.subscriber?.subscription_end,
                  subscribed: result.subscriber?.subscribed,
                  stripe_subscription_id: result.subscriber?.stripe_subscription_id,
                  hasActiveSubscription: result.hasActiveSubscription
                },
                isAdmin: result.isAdmin,
                lastFetchTime: Date.now()
              };
            }
            return prev;
          });
        }
      }).catch((error) => {
        console.warn('⚠️ Polling fetch failed:', error);
      });
    }, 10000); // Poll every 10 seconds
  }, [user?.id, fetchProfileData]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Stopping fallback polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Initialize profile data when user changes
  useEffect(() => {
    if (!user) {
      setState(prev => ({
        ...prev,
        personalInfo: {
          fullName: '',
          email: '',
          companyName: '',
          packageType: 'free'
        },
        userProfile: null,
        isAdmin: false,
        loading: false,
        profileError: 'No user found'
      }));
      stopPolling();
      return;
    }

    // Immediately set profile data from user auth data
    const initialInfo = getPersonalInfoFromUser(user);
    setState(prev => ({
      ...prev,
      personalInfo: initialInfo,
      loading: true,
      profileError: null
    }));

    // Start fallback polling
    startPolling();

    // ENHANCED: Load fresh data with subscription priority
    fetchProfileData(user.id, true) // Force refresh for initial load
      .then((result) => {
        if (result) {
          // CRITICAL: Use subscribers table as primary source for subscription data
          const packageType = result.subscriber?.subscription_tier || 
                             result.profile?.package_type || 
                             'free';
          
          const profileInfo: PersonalInfo = {
            fullName: result.profile?.full_name || user.user_metadata?.full_name || '',
            email: result.profile?.email || user.email || '',
            companyName: result.profile?.company_name || user.user_metadata?.company_name || '',
            packageType: packageType as any
          };

          setState(prev => ({
            ...prev,
            personalInfo: profileInfo,
            userProfile: {
              ...result.profile,
              // ENHANCED: Include live subscription data from subscribers table
              subscription_tier: result.subscriber?.subscription_tier,
              subscription_status: result.subscriber?.subscription_status,
              subscription_end: result.subscriber?.subscription_end,
              subscribed: result.subscriber?.subscribed,
              stripe_subscription_id: result.subscriber?.stripe_subscription_id,
              hasActiveSubscription: result.hasActiveSubscription
            },
            isAdmin: result.isAdmin,
            loading: false,
            profileError: null,
            lastFetchTime: Date.now()
          }));
        } else {
          // Keep initial data if fetch failed
          setState(prev => ({
            ...prev,
            loading: false
          }));
        }
      })
      .catch((error) => {
        console.error('💥 Profile loading failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          profileError: error.message || 'Failed to load profile'
        }));
      });

    return () => {
      stopPolling();
    };
  }, [user, fetchProfileData, startPolling, stopPolling]);

  // Profile update handlers with explicit batching
  const handlePersonalInfoChange = useCallback((field: string, value: string) => {
    flushSync(() => {
      setState(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value
        }
      }));
    });
  }, []);

  const handleEditToggle = useCallback(() => {
    flushSync(() => {
      setState(prev => ({
        ...prev,
        isEditing: !prev.isEditing
      }));
    });
  }, []);

  // ENHANCED: Refresh with aggressive cache clearing
  const refreshProfile = useCallback(() => {
    if (user) {
      console.log('🔄 Force refreshing profile with cache clear...');
      clearProfileCache(user.id);
      
      flushSync(() => {
        setState(prev => ({ ...prev, loading: true }));
      });
      
      fetchProfileData(user.id, true) // Force refresh
        .then((result) => {
          if (result) {
            const packageType = result.subscriber?.subscription_tier || 
                               result.profile?.package_type || 
                               'free';
            
            const profileInfo: PersonalInfo = {
              fullName: result.profile?.full_name || user.user_metadata?.full_name || '',
              email: result.profile?.email || user.email || '',
              companyName: result.profile?.company_name || user.user_metadata?.company_name || '',
              packageType: packageType as any
            };

            flushSync(() => {
              setState(prev => ({
                ...prev,
                personalInfo: profileInfo,
                userProfile: {
                  ...result.profile,
                  subscription_tier: result.subscriber?.subscription_tier,
                  subscription_status: result.subscriber?.subscription_status,
                  subscription_end: result.subscriber?.subscription_end,
                  subscribed: result.subscriber?.subscribed,
                  stripe_subscription_id: result.subscriber?.stripe_subscription_id,
                  hasActiveSubscription: result.hasActiveSubscription
                },
                isAdmin: result.isAdmin,
                loading: false,
                profileError: null,
                lastFetchTime: Date.now()
              }));
            });
          }
        })
        .catch((error) => {
          console.error('💥 Profile refresh failed:', error);
          setState(prev => ({
            ...prev,
            loading: false,
            profileError: error.message || 'Failed to refresh profile'
          }));
        });
    }
  }, [user, fetchProfileData]);

  return {
    ...state,
    handlePersonalInfoChange,
    handleEditToggle,
    refreshProfile,
    clearCache: () => user && clearProfileCache(user.id),
    fetchUserProfile: refreshProfile
  };
};
