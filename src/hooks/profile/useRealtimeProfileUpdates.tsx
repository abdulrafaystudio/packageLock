
import { useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeProfileUpdatesProps {
  user: User | null;
  onProfileUpdate: () => void;
}

export const useRealtimeProfileUpdates = ({ user, onProfileUpdate }: UseRealtimeProfileUpdatesProps) => {
  
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('🔄 Real-time profile update received:', payload);
    console.log('📊 Profile update details:', {
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      old: payload.old,
      new: payload.new,
      timestamp: new Date().toISOString()
    });
    
    // Check if this update is for the current user
    if (payload.new && payload.new.id === user?.id) {
      console.log('✅ Profile update is for current user, refreshing...');
      console.log('📋 Updated fields:', payload.new);
      onProfileUpdate();
    } else {
      console.log('ℹ️ Profile update for different user:', {
        payloadUserId: payload.new?.id,
        currentUserId: user?.id
      });
    }
  }, [user?.id, onProfileUpdate]);

  const handleSubscriberUpdate = useCallback((payload: any) => {
    console.log('🔄 Real-time subscriber update received:', payload);
    console.log('📊 Subscriber update details:', {
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      old: payload.old,
      new: payload.new,
      timestamp: new Date().toISOString()
    });
    
    // Check if this update is for the current user
    if (payload.new && payload.new.user_id === user?.id) {
      console.log('✅ Subscriber update is for current user, refreshing...');
      console.log('📋 Updated subscription fields:', {
        subscriptionTier: payload.new.subscription_tier,
        subscriptionStatus: payload.new.subscription_status,
        subscribed: payload.new.subscribed,
        stripeCustomerId: payload.new.stripe_customer_id,
        stripeSubscriptionId: payload.new.stripe_subscription_id
      });
      onProfileUpdate();
    } else {
      console.log('ℹ️ Subscriber update for different user:', {
        payloadUserId: payload.new?.user_id,
        currentUserId: user?.id
      });
    }
  }, [user?.id, onProfileUpdate]);

  // Handle PostgreSQL NOTIFY events for upgrade completion
  const handleUpgradeNotification = useCallback((payload: any) => {
    console.log('🔔 PostgreSQL NOTIFY event received:', payload);
    console.log('📊 NOTIFY payload details:', {
      type: payload.type,
      event: payload.event,
      payload: payload.payload,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Parse the notification payload
      const notificationData = typeof payload.payload === 'string' 
        ? JSON.parse(payload.payload)
        : payload.payload;
        
      console.log('📋 Parsed notification data:', notificationData);
      
      if (notificationData.user_id === user?.id) {
        console.log('✅ Upgrade notification is for current user, refreshing...');
        console.log('🚀 Upgrade notification details:', {
          packageType: notificationData.package_type,
          subscriptionStatus: notificationData.subscription_status,
          triggerSource: notificationData.trigger_source,
          timestamp: notificationData.timestamp
        });
        onProfileUpdate();
      } else {
        console.log('ℹ️ Upgrade notification for different user:', {
          notificationUserId: notificationData.user_id,
          currentUserId: user?.id
        });
      }
    } catch (parseError) {
      console.error('❌ Failed to parse NOTIFY payload:', parseError);
      console.log('🔄 Triggering fallback profile refresh');
      onProfileUpdate(); // Fallback refresh
    }
  }, [user?.id, onProfileUpdate]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🚀 Setting up real-time subscriptions for user:', user.id);

    // Set up real-time listener for profiles table changes
    const profileChannel = supabase
      .channel('profile_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, handleRealtimeUpdate)
      .subscribe((status) => {
        console.log('📡 Profile channel status:', status);
      });

    // Set up real-time listener for subscribers table changes
    const subscriberChannel = supabase
      .channel('subscriber_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscribers',
        filter: `user_id=eq.${user.id}`
      }, handleSubscriberUpdate)
      .subscribe((status) => {
        console.log('📡 Subscriber channel status:', status);
      });

    // Set up listener for PostgreSQL NOTIFY events from database functions
    const notificationChannel = supabase
      .channel('upgrade_notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'profiles'
      }, (payload) => {
        console.log('🔔 Profile table change detected:', payload);
        if (payload.eventType === 'UPDATE' && payload.new?.id === user.id) {
          console.log('✅ Profile change for current user detected');
          handleRealtimeUpdate(payload);
        }
      })
      .subscribe((status) => {
        console.log('📡 Notification channel status:', status);
      });

    // Listen for PostgreSQL NOTIFY events via broadcast
    const broadcastChannel = supabase
      .channel('profile_upgrade_complete')
      .on('broadcast', { event: 'profile_upgrade_complete' }, handleUpgradeNotification)
      .subscribe((status) => {
        console.log('📡 Broadcast channel status:', status);
      });

    // Additional channel to listen for pg_notify directly
    const pgNotifyChannel = supabase
      .channel('pg_notify_listener')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: '*'
      }, (payload) => {
        // This will catch any database changes that might trigger notifications
        console.log('🔍 Database change detected:', payload);
      })
      .subscribe((status) => {
        console.log('📡 PG Notify channel status:', status);
      });

    // Monitor channel statuses
    const channelStatusInterval = setInterval(() => {
      console.log('📊 Real-time channel status check:', {
        profileChannel: profileChannel.state,
        subscriberChannel: subscriberChannel.state,
        notificationChannel: notificationChannel.state,
        broadcastChannel: broadcastChannel.state,
        pgNotifyChannel: pgNotifyChannel.state,
        timestamp: new Date().toISOString()
      });
    }, 30000); // Check every 30 seconds

    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      clearInterval(channelStatusInterval);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(subscriberChannel);
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(pgNotifyChannel);
    };
  }, [user?.id, handleRealtimeUpdate, handleSubscriberUpdate, handleUpgradeNotification, onProfileUpdate]);

  return {
    // Return any additional real-time status if needed
  };
};
