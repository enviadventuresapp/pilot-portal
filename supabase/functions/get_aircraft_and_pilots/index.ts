
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
    // Create a Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching aircraft and pilots data');
    
    // Get all aircraft and pilots in parallel
    const [aircraftResult, pilotsResult] = await Promise.all([
      supabase.from('aircraft').select('*').order('tail_number'),
      supabase.rpc('get_all_pilots')
    ]);

    if (aircraftResult.error) {
      console.error('Error fetching aircraft:', aircraftResult.error);
      throw aircraftResult.error;
    }

    if (pilotsResult.error) {
      console.error('Error fetching pilots:', pilotsResult.error);
      throw pilotsResult.error;
    }

    const response = {
      aircraft: aircraftResult.data,
      pilots: pilotsResult.data
    };

    console.log(`Successfully fetched ${aircraftResult.data?.length || 0} aircraft and ${pilotsResult.data?.length || 0} pilots`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get_aircraft_and_pilots edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred',
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
