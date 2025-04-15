
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
    const { p_flight_id } = await req.json();
    
    if (!p_flight_id) {
      return new Response(
        JSON.stringify({ error: 'Flight ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get flight by ID with pilot information
    const { data: flight, error } = await supabase
      .from('flights')
      .select(`
        id,
        aircraft_id,
        pilot_id,
        date,
        tach_start,
        tach_end,
        hobbs_time,
        fuel_added,
        oil_added,
        passenger_count,
        route,
        squawks,
        notes,
        created_at,
        updated_at,
        category,
        departure_time,
        pilots (name)
      `)
      .eq('id', p_flight_id)
      .single();

    if (error) {
      console.error('Error fetching flight by ID:', error);
      throw error;
    }

    // Format the flight data
    const formattedFlight = [{
      id: flight.id,
      aircraft_id: flight.aircraft_id,
      pilot_id: flight.pilot_id,
      date: flight.date,
      tach_start: flight.tach_start,
      tach_end: flight.tach_end,
      hobbs_time: flight.hobbs_time,
      fuel_added: flight.fuel_added,
      oil_added: flight.oil_added,
      passenger_count: flight.passenger_count,
      route: flight.route,
      squawks: flight.squawks,
      notes: flight.notes,
      created_at: flight.created_at,
      updated_at: flight.updated_at,
      category: flight.category,
      departure_time: flight.departure_time,
      pilot_name: flight.pilots?.name
    }];

    return new Response(
      JSON.stringify(formattedFlight),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get_flight_by_id:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
