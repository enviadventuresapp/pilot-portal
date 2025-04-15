
import { supabase } from '@/integrations/supabase/client';
import { PilotRecord } from '@/types';
import { dbPilotToPilot, pilotToDbPilot } from '@/utils/dbModelConverters';

export const getAllPilots = async () => {
  try {
    console.log('Fetching all pilots...');
    
    // First try to get pilots from the combined edge function
    try {
      const { data, error } = await supabase.functions.invoke('get_aircraft_and_pilots');
      
      if (!error && data && data.pilots && Array.isArray(data.pilots)) {
        console.log(`Got ${data.pilots.length} pilots from combined edge function`);
        
        // Convert from DB format to App format
        const pilots = data.pilots.map(dbPilotToPilot);
        
        return { success: true, pilots };
      }
      
      console.log("Combined function failed or returned no pilots, trying dedicated pilot function");
    } catch (combinedError) {
      console.error("Error in combined edge function, trying fallback:", combinedError);
    }
    
    // Fallback to dedicated pilot function
    try {
      const { data, error } = await supabase.functions.invoke('get_all_pilots');
  
      if (error) {
        console.error('Error fetching pilots from edge function:', error);
        return { success: false, error: error.message };
      }
  
      if (!data) {
        console.error('No data returned from pilot edge function');
        return { success: false, error: 'No data returned from server' };
      }
  
      console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 0} pilots`);
      
      // Convert from DB format to App format
      const pilots = Array.isArray(data) ? data.map(dbPilotToPilot) : [];
  
      return { success: true, pilots };
    } catch (edgeError) {
      console.error("Edge function error, trying direct database query:", edgeError);
      
      // Final fallback - direct database query
      const { data, error } = await supabase
        .from('pilots')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      const pilots = data.map(dbPilotToPilot);
      console.log(`Got ${pilots.length} pilots from direct database query`);
      
      return { success: true, pilots };
    }
  } catch (error) {
    console.error('Error in getAllPilots:', error);
    return { success: false, error: String(error) };
  }
};

export const getPilotById = async (pilotId: string) => {
  try {
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', pilotId)
      .single();

    if (error) {
      console.error('Error fetching pilot:', error);
      return { success: false, error: error.message };
    }

    // Convert to app model
    const pilot = dbPilotToPilot(data);

    return { success: true, pilot };
  } catch (error) {
    console.error('Error in getPilotById:', error);
    return { success: false, error: String(error) };
  }
};

export const createPilot = async (pilotData: Partial<PilotRecord>) => {
  try {
    const dbPilot = pilotToDbPilot(pilotData);

    // Ensure required fields are present
    if (!dbPilot.name) {
      return {
        success: false,
        error: 'Pilot name is required'
      };
    }

    // Fix: Explicitly type the values to ensure name is present
    const { data, error } = await supabase
      .from('pilots')
      .insert({
        name: dbPilot.name, // Ensure name is present
        email: dbPilot.email,
        user_id: dbPilot.user_id,
        is_admin: dbPilot.is_admin,
        is_hidden: dbPilot.is_hidden
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating pilot:', error);
      return { success: false, error: error.message };
    }

    // Convert returned data to app model
    const createdPilot = dbPilotToPilot(data);

    return { success: true, pilot: createdPilot };
  } catch (error) {
    console.error('Error in createPilot:', error);
    return { success: false, error: String(error) };
  }
};

export const updatePilot = async (pilotId: string, pilot: Partial<PilotRecord>) => {
  try {
    const dbPilot = pilotToDbPilot(pilot);
    
    const { data, error } = await supabase
      .from('pilots')
      .update(dbPilot)
      .eq('id', pilotId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating pilot:', error);
      return { success: false, error: error.message };
    }
    
    // Convert returned data to app model
    const updatedPilot = dbPilotToPilot(data);
    
    return { success: true, pilot: updatedPilot };
  } catch (error) {
    console.error('Error in updatePilot:', error);
    return { success: false, error: String(error) };
  }
};

export const deletePilot = async (pilotId: string) => {
  try {
    const { error } = await supabase
      .from('pilots')
      .delete()
      .eq('id', pilotId);

    if (error) {
      console.error('Error deleting pilot:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deletePilot:', error);
    return { success: false, error: String(error) };
  }
};
