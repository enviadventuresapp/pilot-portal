
import { useCallback, useEffect, useState } from 'react';
import { PilotRecord } from '@/types';
import { getAllPilots } from '@/services/pilotService';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

/**
 * Custom hook to manage pilots data
 */
export function usePilots() {
  const [pilots, setPilots] = useState<PilotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch pilots data
  const fetchPilots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching pilots data from server...');
      
      const { success, pilots: fetchedPilots, error: fetchError } = await getAllPilots();

      if (!success || fetchError) {
        console.error('Failed to fetch pilots:', fetchError);
        throw fetchError || new Error('Failed to fetch pilots');
      }

      if (fetchedPilots) {
        console.log(`Successfully fetched ${fetchedPilots.length} pilots`);
        setPilots(fetchedPilots);
      }
    } catch (err) {
      console.error('Error in fetchPilots:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    console.log('Initializing pilots hook and fetching initial data...');
    fetchPilots();
  }, [fetchPilots]);

  // Setup real-time subscription for pilots table
  useRealtimeSubscription({
    table: 'pilots',
    onInsert: (newPilot) => {
      console.log('Pilot inserted:', newPilot);
      fetchPilots(); // Refetch all pilots to ensure consistency
    },
    onUpdate: (updatedPilot) => {
      console.log('Pilot updated:', updatedPilot);
      setPilots(current => current.map(p => 
        p.id === updatedPilot.id 
        ? { 
            ...p, 
            name: updatedPilot.name,
            email: updatedPilot.email,
            isAdmin: updatedPilot.is_admin,
            isHidden: updatedPilot.is_hidden
          } 
        : p
      ));
    },
    onDelete: (deletedPilot) => {
      console.log('Pilot deleted:', deletedPilot);
      setPilots(current => current.filter(p => p.id !== deletedPilot.id));
    }
  });

  // Get a pilot by ID
  const getPilotById = useCallback(
    (id: string) => {
      return pilots.find((pilot) => pilot.id === id);
    },
    [pilots]
  );

  // Get active pilots (not hidden)
  const getActivePilots = useCallback(() => {
    return pilots.filter((pilot) => !pilot.isHidden);
  }, [pilots]);

  return {
    pilots,
    loading,
    error,
    fetchPilots,
    getPilotById,
    getActivePilots,
  };
}
