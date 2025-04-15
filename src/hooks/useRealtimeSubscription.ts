
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface SubscriptionOptions {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: Record<string, any>;
}

export function useRealtimeSubscription({
  table,
  onInsert,
  onUpdate,
  onDelete,
  filter
}: SubscriptionOptions) {
  useEffect(() => {
    // Create a unique channel name for this table
    const channelName = `${table}_changes_${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`Setting up realtime subscription for ${table}`);
    
    // Create channel
    const channel = supabase.channel(channelName);
    
    // Define the subscription configuration
    const subscriptionConfig: any = {
      event: '*' as const,
      schema: 'public',
      table
    };
    
    // Add filter if provided
    if (filter && Object.keys(filter).length > 0) {
      console.log(`Adding filter for table ${table}:`, filter);
      subscriptionConfig.filter = filter;
    }
    
    console.log(`Subscription config:`, subscriptionConfig);
    
    // Fix the type issue by using the correct type annotations
    channel.on(
      'postgres_changes',
      subscriptionConfig,
      (payload: RealtimePostgresChangesPayload<any>) => {
        console.log(`Received realtime event for ${table}:`, payload.eventType, payload);
        
        // Type guard for the payload event type
        if (!payload.eventType) {
          console.error('Missing eventType in payload:', payload);
          return;
        }

        switch (payload.eventType) {
          case 'INSERT':
            if (onInsert) {
              console.log(`Calling onInsert for ${table}`, payload.new);
              onInsert(payload.new);
            }
            break;
          case 'UPDATE':
            if (onUpdate) {
              console.log(`Calling onUpdate for ${table}`, payload.new);
              onUpdate(payload.new);
            }
            break;
          case 'DELETE':
            if (onDelete) {
              console.log(`Calling onDelete for ${table}`, payload.old);
              onDelete(payload.old);
            }
            break;
        }
      }
    );
    
    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`Subscription status for ${table}: ${status}`);
    });

    return () => {
      console.log(`Unsubscribing from ${table} changes`);
      supabase.removeChannel(channel);
    };
  }, [table, onInsert, onUpdate, onDelete, JSON.stringify(filter)]); // Stringify filter to properly detect changes
}
