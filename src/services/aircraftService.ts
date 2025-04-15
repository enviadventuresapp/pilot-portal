
import { supabase } from '@/integrations/supabase/client';
import { Aircraft } from '@/types';
import { dbAircraftToAircraft, aircraftToDbAircraft, DbAircraft } from '@/utils/dbModelConverters';

// Ensure we have an active session
const ensureSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('No active session');
  }
  return session;
};

/**
 * Get all aircraft
 */
export const getAllAircraft = async () => {
  try {
    console.log("Executing getAllAircraft...");
    
    // First try to get aircraft from the edge function that combines aircraft and pilots
    try {
      const { data, error } = await supabase.functions.invoke('get_aircraft_and_pilots');
      
      if (!error && data && data.aircraft && Array.isArray(data.aircraft)) {
        console.log(`Got ${data.aircraft.length} aircraft from combined edge function`);
        
        // Transform to our application model
        const aircraft = data.aircraft.map(item => ({
          id: item.id,
          tail_number: item.tail_number,
          tailNumber: item.tail_number,
          make: item.make,
          model: item.model,
          year: item.year,
          type: item.type || item.make || 'unknown',
          registration: item.registration,
          category: item.category || '',
          tachTime: item.tach_time || 0,
          oilChange: item.oil_change || null,
          lastAnnual: item.last_annual || null,
          ownership: item.ownership || '',
          imageUrl: item.image_url || '',
          lastFlight: item.last_flight || null,
          created_at: item.created_at,
          updated_at: item.updated_at,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));
        
        return { success: true, aircraft };
      }
      
      // If combined function fails, fall back to specific aircraft function
      console.log("Combined function failed, trying dedicated aircraft function");
    } catch (combinedError) {
      console.error("Error in combined edge function, trying fallback:", combinedError);
    }
    
    // Fallback to dedicated aircraft function
    const { data, error } = await supabase.functions.invoke('get_all_aircraft');
    
    if (error) {
      console.error('Error getting aircraft from dedicated function:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data format returned from get_all_aircraft:', data);
      return { success: false, aircraft: [], error: new Error('Invalid data format') };
    }
    
    console.log("Aircraft data received:", data);
    
    // Transform to our application model
    const aircraft = data.map(item => ({
      id: item.id,
      tail_number: item.tail_number,
      tailNumber: item.tail_number,
      make: item.make,
      model: item.model,
      year: item.year,
      type: item.type || item.make || 'unknown',
      registration: item.registration,
      category: item.category || '',
      tachTime: item.tach_time || 0,
      oilChange: item.oil_change || null,
      lastAnnual: item.last_annual || null,
      ownership: item.ownership || '',
      imageUrl: item.image_url || '',
      lastFlight: item.last_flight || null,
      created_at: item.created_at,
      updated_at: item.updated_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
    
    return { success: true, aircraft };
  } catch (error) {
    console.error('Error getting aircraft:', error);
    return { success: false, aircraft: [], error };
  }
};

/**
 * Get an aircraft by ID
 */
export const getAircraftById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('aircraft')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const aircraft = dbAircraftToAircraft(data as unknown as DbAircraft);
    
    return { success: true, aircraft };
  } catch (error) {
    console.error('Error getting aircraft by ID:', error);
    return { success: false, error };
  }
};

/**
 * Create a new aircraft
 */
export const createAircraft = async (aircraft: Omit<Aircraft, 'id'>) => {
  try {
    // Make sure we have all required fields
    const requiredFields = {
      tail_number: aircraft.tailNumber || aircraft.tail_number || '',
      make: aircraft.make || '',
      model: aircraft.model || '',
      type: aircraft.type || aircraft.make || 'unknown',
      year: aircraft.year || ''
    };
    
    const { data, error } = await supabase
      .from('aircraft')
      .insert(requiredFields)
      .select()
      .single();
    
    if (error) throw error;
    
    const newAircraft = dbAircraftToAircraft(data as unknown as DbAircraft);
    
    return { success: true, aircraft: newAircraft };
  } catch (error) {
    console.error('Error creating aircraft:', error);
    return { success: false, error };
  }
};

/**
 * Update an aircraft
 */
export const updateAircraft = async (id: string, aircraft: Partial<Aircraft>) => {
  try {
    const dbAircraft = aircraftToDbAircraft(aircraft);
    
    const { data, error } = await supabase
      .from('aircraft')
      .update(dbAircraft)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    const updatedAircraft = dbAircraftToAircraft(data as unknown as DbAircraft);
    
    return { success: true, aircraft: updatedAircraft };
  } catch (error) {
    console.error('Error updating aircraft:', error);
    return { success: false, error };
  }
};

/**
 * Delete an aircraft
 */
export const deleteAircraft = async (id: string) => {
  try {
    const { error } = await supabase
      .from('aircraft')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting aircraft:', error);
    return { success: false, error };
  }
};
