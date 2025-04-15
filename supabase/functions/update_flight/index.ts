
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { p_flight_id, p_flight_data } = await req.json();
    
    if (!p_flight_id || !p_flight_data) {
      return new Response(
        JSON.stringify({ error: 'Flight ID and flight data are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log received data for debugging
    console.log("Updating flight with ID:", p_flight_id);
    console.log("Flight data:", p_flight_data);

    // Prepare update data (only include fields that are provided)
    const updateData: Record<string, any> = {};
    
    if (p_flight_data.aircraft_id !== undefined) updateData.aircraft_id = p_flight_data.aircraft_id;
    if (p_flight_data.pilot_id !== undefined) updateData.pilot_id = p_flight_data.pilot_id;
    if (p_flight_data.date !== undefined) updateData.date = p_flight_data.date;
    if (p_flight_data.tach_start !== undefined) updateData.tach_start = p_flight_data.tach_start;
    if (p_flight_data.tach_end !== undefined) updateData.tach_end = p_flight_data.tach_end;
    if (p_flight_data.hobbs_time !== undefined) updateData.hobbs_time = p_flight_data.hobbs_time;
    if (p_flight_data.fuel_added !== undefined) updateData.fuel_added = p_flight_data.fuel_added;
    if (p_flight_data.oil_added !== undefined) updateData.oil_added = p_flight_data.oil_added;
    if (p_flight_data.passenger_count !== undefined) updateData.passenger_count = p_flight_data.passenger_count;
    
    // Explicitly handle route and category fields to ensure they match the dropdown options
    if (p_flight_data.route !== undefined) {
      console.log(`Processing route: "${p_flight_data.route}"`);
      updateData.route = p_flight_data.route;
    }
    
    if (p_flight_data.category !== undefined) {
      console.log(`Processing category: "${p_flight_data.category}"`);
      updateData.category = p_flight_data.category;
    }
    
    if (p_flight_data.squawks !== undefined) updateData.squawks = p_flight_data.squawks;
    if (p_flight_data.notes !== undefined) updateData.notes = p_flight_data.notes;
    if (p_flight_data.departure_time !== undefined) updateData.departure_time = p_flight_data.departure_time;

    console.log("Processed update data:", updateData);

    // Update the flight
    const { data: updatedFlight, error: updateError } = await supabase
      .from('flights')
      .update(updateData)
      .eq('id', p_flight_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating flight:', updateError);
      throw updateError;
    }

    console.log("Updated flight:", updatedFlight);

    // Get the pilot name
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('name')
      .eq('id', updatedFlight.pilot_id)
      .single();

    if (pilotError) {
      console.error('Error fetching pilot:', pilotError);
      // Continue without pilot name
    }

    // Format the response
    const formattedFlight = [{
      ...updatedFlight,
      pilot_name: pilot?.name || ''
    }];

    return new Response(
      JSON.stringify(formattedFlight),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update_flight:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
