import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { clearAllProfileCache } from '@/utils/cache-manager';

console.log('🔧 usePostUpgradeHandler loaded - version 2.0'); // Force refresh

interface UsePostUpgradeHandlerProps {
  refreshProfile: () => void;
}

export const usePostUpgradeHandler = ({ refreshProfile }: UsePostUpgradeHandlerProps) => {
  const { user, checkSubscription } = useAuth();
  const { toast } = useToast();
  
  console.log('🎯 usePostUpgradeHandler initialized for user:', user?.id);

  // Handle real-time PostgreSQL NOTIFY events for upgrade completion
  const handleUpgradeComplete = useCallback(async (payload: any) => {
    console.log('🎯 UPGRADE COMPLETE NOTIFICATION:', payload);
    
    try {
      // Validate payload structure
      if (!payload || typeof payload !== 'object') {
        console.warn('⚠️ Invalid payload received:', payload);
        return;
      }

      const userId = payload.user_id || payload.userId;
      const packageType = payload.package_type || payload.packageType;
      
      if (!userId) {
        console.warn('⚠️ No user_id in payload:', payload);
        return;
      }

      if (userId === user?.id) {
        console.log('✅ Upgrade complete for current user, refreshing immediately...');
        console.log('📊 Upgrade details:', { 
          userId, 
          packageType, 
          subscriptionStatus: payload.subscription_status,
          triggerSource: payload.trigger_source,
          timestamp: payload.timestamp
        });
        
        // Clear all cache immediately
        clearAllProfileCache();
        
        // Force immediate refresh with retry logic
        try {
          await refreshProfile();
          if (checkSubscription) {
            await checkSubscription();
          }
          console.log('✅ Profile refresh completed successfully');
        } catch (refreshError) {
          console.error('❌ Profile refresh failed:', refreshError);
          // Retry once after a short delay
          setTimeout(async () => {
            try {
              await refreshProfile();
              console.log('✅ Profile refresh retry successful');
            } catch (retryError) {
              console.error('❌ Profile refresh retry failed:', retryError);
            }
          }, 1000);
        }
        
        // Show success toast
       
        
        // Trigger window event for other components
        window.dispatchEvent(new CustomEvent('upgrade-complete', { detail: payload }));
      } else {
        console.log('ℹ️ Upgrade notification for different user:', { 
          payloadUserId: userId, 
          currentUserId: user?.id 
        });
      }
    } catch (error) {
      console.error('💥 Error handling upgrade complete:', error);
      // Fallback: still trigger a profile refresh
      try {
        await refreshProfile();
        console.log('✅ Fallback profile refresh completed');
      } catch (fallbackError) {
        console.error('❌ Fallback profile refresh failed:', fallbackError);
      }
    }
  }, [user?.id, refreshProfile, checkSubscription, toast]);

  // Set up real-time listeners for upgrade events
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Setting up upgrade complete listeners for user:', user.id);

    // Listen for PostgreSQL NOTIFY events (from the enhanced transaction)
    const handleProfileUpgradeEvent = (event: MessageEvent) => {
      console.log('📨 Raw message event received:', event);
      
      try {
        // Handle different event data formats
        let eventData = event.data;
        
        // If it's a string, try to parse it
        if (typeof eventData === 'string') {
          try {
            eventData = JSON.parse(eventData);
          } catch (parseError) {
            console.warn('⚠️ Could not parse event.data as JSON:', eventData);
            return;
          }
        }
        
        console.log('📋 Parsed event data:', eventData);
        
        // Handle different message formats
        if (eventData.channel === 'profile_upgrade_complete') {
          // Format: { channel: 'profile_upgrade_complete', payload: '{"user_id": "..."}' }
          try {
            const payload = typeof eventData.payload === 'string' 
              ? JSON.parse(eventData.payload) 
              : eventData.payload;
            console.log('🔄 Processing upgrade notification from channel event:', payload);
            handleUpgradeComplete(payload);
          } catch (payloadError) {
            console.error('❌ Failed to parse payload from channel event:', payloadError);
          }
        } else if (eventData.user_id || eventData.userId) {
          // Direct payload format
          console.log('🔄 Processing direct upgrade notification:', eventData);
          handleUpgradeComplete(eventData);
        } else {
          console.log('ℹ️ Unrecognized message format:', eventData);
        }
      } catch (error) {
        console.error('💥 Failed to parse upgrade event:', error, 'Raw data:', event.data);
        
        // Fallback: if we can't parse the event but it might be upgrade-related
        if (event.data && typeof event.data === 'string' && event.data.includes('upgrade')) {
          console.log('🔄 Triggering fallback profile refresh due to upgrade-related event');
          handleUpgradeComplete({ user_id: user?.id, trigger_source: 'fallback_parse_error' });
        }
      }
    };

    // Listen for custom window events
    const handleCustomUpgradeEvent = (event: CustomEvent) => {
      handleUpgradeComplete(event.detail);
    };

    window.addEventListener('message', handleProfileUpgradeEvent);
    window.addEventListener('upgrade-complete', handleCustomUpgradeEvent as EventListener);

    return () => {
      window.removeEventListener('message', handleProfileUpgradeEvent);
      window.removeEventListener('upgrade-complete', handleCustomUpgradeEvent as EventListener);
    };
  }, [user?.id, handleUpgradeComplete]);

  return {
    // Expose handler for manual triggering if needed
    triggerUpgradeComplete: handleUpgradeComplete
  };
};