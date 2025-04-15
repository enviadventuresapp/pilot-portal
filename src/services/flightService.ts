
import { supabase } from '@/integrations/supabase/client';
import { Flight } from '@/types';
import { dbFlightToFlight, flightToDbFlight } from '@/utils/dbModelConverters';

// Ensure we have an active session
const ensureSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('No active session');
  }
  return session;
};

/**
 * Get all flights - using a stored procedure to avoid RLS recursion
 */
export const getAllFlights = async () => {
  try {
    console.log('Getting all flights...');
    
    // Call the Edge Function directly
    const { data: flightsData, error: flightsError } = await supabase.functions.invoke('get_all_flights');
    
    if (flightsError) {
      console.error('Error getting flights from edge function:', flightsError);
      throw flightsError;
    }
    
    if (!flightsData || !Array.isArray(flightsData)) {
      console.error('Invalid data format returned from get_all_flights:', flightsData);
      return { success: false, flights: [], error: 'Invalid data format' };
    }
    
    console.log(`Received ${flightsData.length} flights from edge function`);
    
    // Map the data to the Flight type
    const flights = flightsData.map(item => {
      const flight = dbFlightToFlight({
        id: item.id,
        aircraft_id: item.aircraft_id,
        pilot_id: item.pilot_id,
        date: item.date,
        tach_start: item.tach_start,
        tach_end: item.tach_end,
        hobbs_time: item.hobbs_time,
        fuel_added: item.fuel_added,
        oil_added: item.oil_added,
        passenger_count: item.passenger_count,
        route: item.route,
        squawks: item.squawks,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.category,
        departure_time: item.departure_time
      });
      flight.pilotName = item.pilot_name || '';
      return flight;
    });
    
    return { success: true, flights };
  } catch (error) {
    console.error('Error getting flights:', error);
    return { success: false, flights: [], error };
  }
};

/**
 * Get flights for a specific aircraft
 */
export const getFlightsByAircraft = async (aircraftId: string) => {
  try {
    await ensureSession();
    
    // Use a stored procedure to get flights for a specific aircraft
    const { data: flightsData, error: flightsError } = await supabase.functions.invoke('get_flights_by_aircraft', {
      body: { p_aircraft_id: aircraftId }
    });
    
    if (flightsError) {
      console.error('Error getting flights by aircraft:', flightsError);
      throw flightsError;
    }
    
    if (!flightsData || !Array.isArray(flightsData)) {
      console.error('Invalid data format returned from get_flights_by_aircraft:', flightsData);
      return { success: false, flights: [], error: new Error('Invalid data format') };
    }
    
    // Map the data to the Flight type
    const flights = flightsData.map(item => {
      const flight = dbFlightToFlight({
        id: item.id,
        aircraft_id: item.aircraft_id,
        pilot_id: item.pilot_id,
        date: item.date,
        tach_start: item.tach_start,
        tach_end: item.tach_end,
        hobbs_time: item.hobbs_time,
        fuel_added: item.fuel_added,
        oil_added: item.oil_added,
        passenger_count: item.passenger_count,
        route: item.route,
        squawks: item.squawks,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.category,
        departure_time: item.departure_time
      });
      flight.pilotName = item.pilot_name || '';
      return flight;
    });
    
    return { success: true, flights };
  } catch (error) {
    console.error('Error getting flights by aircraft:', error);
    return { success: false, flights: [], error };
  }
};

/**
 * Get a flight by ID
 */
export const getFlightById = async (id: string) => {
  try {
    console.log(`Getting flight with ID: ${id}`);
    
    // Use a stored procedure to get a flight by ID
    const { data, error } = await supabase.functions.invoke('get_flight_by_id', {
      body: { p_flight_id: id }
    });
    
    if (error) {
      console.error('Error getting flight by ID:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('Flight not found with ID:', id);
      return { success: false, error: { message: 'Flight not found' } };
    }
    
    console.log('Retrieved flight data:', data[0]);
    const flightData = data[0];
    
    // Convert to our app format
    const flight = dbFlightToFlight({
      id: flightData.id,
      aircraft_id: flightData.aircraft_id,
      pilot_id: flightData.pilot_id,
      date: flightData.date,
      tach_start: flightData.tach_start,
      tach_end: flightData.tach_end,
      hobbs_time: flightData.hobbs_time,
      fuel_added: flightData.fuel_added,
      oil_added: flightData.oil_added,
      passenger_count: flightData.passenger_count,
      route: flightData.route,
      squawks: flightData.squawks,
      notes: flightData.notes,
      created_at: flightData.created_at,
      updated_at: flightData.updated_at,
      category: flightData.category,
      departure_time: flightData.departure_time
    });
    flight.pilotName = flightData.pilot_name || '';
    
    return { success: true, flight };
  } catch (error) {
    console.error('Error getting flight by ID:', error);
    return { success: false, error };
  }
};

/**
 * Create a new flight
 */
export const createFlight = async (flight: Partial<Flight>, pilotId: string) => {
  try {
    console.log('Creating flight with data:', flight);
    console.log('Using pilot ID:', pilotId);
    
    // Validate pilot ID
    if (!pilotId) {
      return {
        success: false,
        error: { message: 'Missing pilot ID' }
      };
    }
    
    // Ensure we have required fields
    if (!flight.date || !flight.aircraftId || flight.tachStart === undefined || flight.tachEnd === undefined) {
      return {
        success: false,
        error: { message: 'Missing required flight information' }
      };
    }
    
    // Create a complete flight data object with all required fields explicitly set
    const flightData = {
      aircraft_id: flight.aircraftId, 
      pilot_id: pilotId,
      date: flight.date,
      tach_start: flight.tachStart,
      tach_end: flight.tachEnd,
      hobbs_time: flight.hobbsTime || 0,
      fuel_added: flight.fuelAdded || null,
      oil_added: flight.oilAdded || null,
      passenger_count: flight.passengerCount || null,
      route: flight.route || null,
      squawks: flight.squawks || null,
      notes: flight.notes || null,
      category: flight.category || null,
      departure_time: flight.departureTime || null
    };
    
    // Use a stored procedure to create a flight
    const { data, error } = await supabase.functions.invoke('create_flight', {
      body: { p_flight_data: flightData }
    });
    
    if (error) {
      console.error('Supabase error creating flight:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data returned from flight creation');
    }
    
    const newFlightData = data[0];
    const newFlight = dbFlightToFlight({
      id: newFlightData.id,
      aircraft_id: newFlightData.aircraft_id,
      pilot_id: newFlightData.pilot_id,
      date: newFlightData.date,
      tach_start: newFlightData.tach_start,
      tach_end: newFlightData.tach_end,
      hobbs_time: newFlightData.hobbs_time,
      fuel_added: newFlightData.fuel_added,
      oil_added: newFlightData.oil_added,
      passenger_count: newFlightData.passenger_count,
      route: newFlightData.route,
      squawks: newFlightData.squawks,
      notes: newFlightData.notes,
      created_at: newFlightData.created_at,
      updated_at: newFlightData.updated_at,
      category: newFlightData.category,
      departure_time: newFlightData.departure_time
    });
    newFlight.pilotName = newFlightData.pilot_name || flight.pilotName || '';
    
    return { success: true, flight: newFlight };
  } catch (error) {
    console.error('Error creating flight:', error);
    return { 
      success: false, 
      error: error instanceof Error ? { message: error.message } : { message: 'An unknown error occurred' } 
    };
  }
};

/**
 * Update a flight
 */
export const updateFlight = async (id: string, flight: Partial<Flight>) => {
  try {
    // Convert to database schema
    const dbFlight = flightToDbFlight(flight);
    
    console.log('Updating flight with data:', dbFlight);
    
    // Use a stored procedure to update a flight
    const { data, error } = await supabase.functions.invoke('update_flight', {
      body: { p_flight_id: id, p_flight_data: dbFlight }
    });
    
    if (error) {
      console.error('Supabase error updating flight:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data returned from flight update');
    }
    
    const updatedFlightData = data[0];
    const updatedFlight = dbFlightToFlight({
      id: updatedFlightData.id,
      aircraft_id: updatedFlightData.aircraft_id,
      pilot_id: updatedFlightData.pilot_id,
      date: updatedFlightData.date,
      tach_start: updatedFlightData.tach_start,
      tach_end: updatedFlightData.tach_end,
      hobbs_time: updatedFlightData.hobbs_time,
      fuel_added: updatedFlightData.fuel_added,
      oil_added: updatedFlightData.oil_added,
      passenger_count: updatedFlightData.passenger_count,
      route: updatedFlightData.route,
      squawks: updatedFlightData.squawks,
      notes: updatedFlightData.notes,
      created_at: updatedFlightData.created_at,
      updated_at: updatedFlightData.updated_at,
      category: updatedFlightData.category,
      departure_time: updatedFlightData.departure_time
    });
    updatedFlight.pilotName = updatedFlightData.pilot_name || flight.pilotName || '';
    
    return { success: true, flight: updatedFlight };
  } catch (error) {
    console.error('Error updating flight:', error);
    return { 
      success: false, 
      error: error instanceof Error ? { message: error.message } : { message: 'An unknown error occurred' } 
    };
  }
};

/**
 * Delete a flight
 */
export const deleteFlight = async (id: string) => {
  try {
    
    // Use a stored procedure to delete a flight
    const { data, error } = await supabase.functions.invoke('delete_flight', {
      body: { p_flight_id: id }
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting flight:', error);
    return { success: false, error };
  }
};

/**
 * Get the most recent flight for an aircraft
 */
export const getMostRecentFlight = async (aircraftId: string) => {
  try {
    // Use a stored procedure to get the most recent flight for an aircraft
    const { data, error } = await supabase.functions.invoke('get_most_recent_flight', {
      body: { p_aircraft_id: aircraftId }
    });
    
    if (error) {
      console.error('Error getting most recent flight:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { success: true, flight: null };
    }
    
    const flightData = data[0];
    const flight = dbFlightToFlight({
      id: flightData.id,
      aircraft_id: flightData.aircraft_id,
      pilot_id: flightData.pilot_id,
      date: flightData.date,
      tach_start: flightData.tach_start,
      tach_end: flightData.tach_end,
      hobbs_time: flightData.hobbs_time,
      fuel_added: flightData.fuel_added,
      oil_added: flightData.oil_added,
      passenger_count: flightData.passenger_count,
      route: flightData.route,
      squawks: flightData.squawks,
      notes: flightData.notes,
      created_at: flightData.created_at,
      updated_at: flightData.updated_at,
      category: flightData.category,
      departure_time: flightData.departure_time
    });
    flight.pilotName = flightData.pilot_name || '';
    
    return { success: true, flight };
  } catch (error) {
    console.error('Error getting most recent flight:', error);
    return { success: false, error };
  }
};
