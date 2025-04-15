
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
    const { p_flight_data } = await req.json();
    
    if (!p_flight_data) {
      return new Response(
        JSON.stringify({ error: 'Flight data is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert the new flight
    const { data: newFlight, error: insertError } = await supabase
      .from('flights')
      .insert({
        aircraft_id: p_flight_data.aircraft_id,
        pilot_id: p_flight_data.pilot_id,
        date: p_flight_data.date,
        tach_start: p_flight_data.tach_start,
        tach_end: p_flight_data.tach_end,
        hobbs_time: p_flight_data.hobbs_time,
        fuel_added: p_flight_data.fuel_added,
        oil_added: p_flight_data.oil_added,
        passenger_count: p_flight_data.passenger_count,
        route: p_flight_data.route,
        squawks: p_flight_data.squawks,
        notes: p_flight_data.notes,
        category: p_flight_data.category,
        departure_time: p_flight_data.departure_time
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating flight:', insertError);
      throw insertError;
    }

    // Get the pilot name
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('name')
      .eq('id', p_flight_data.pilot_id)
      .single();

    if (pilotError) {
      console.error('Error fetching pilot:', pilotError);
      // Continue without pilot name
    }

    // Format the response
    const formattedFlight = [{
      ...newFlight,
      pilot_name: pilot?.name || ''
    }];

    return new Response(
      JSON.stringify(formattedFlight),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create_flight:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
