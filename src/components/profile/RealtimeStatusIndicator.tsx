
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const RealtimeStatusIndicator = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Test channel to monitor connection status
    const statusChannel = supabase
      .channel('realtime_status')
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, () => {
        setLastUpdate(new Date());
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(statusChannel);
      setIsConnected(false);
    };
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        } ${isConnected ? 'animate-pulse' : ''}`} />
        <span>
          Real-time: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {lastUpdate && (
          <span className="text-xs opacity-70">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default RealtimeStatusIndicator;
