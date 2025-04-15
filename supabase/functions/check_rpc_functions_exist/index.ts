
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
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if our RPC functions exist
    const functionsToCheck = [
      'get_all_flights',
      'get_flights_by_aircraft',
      'get_flight_by_id',
      'create_flight',
      'update_flight',
      'delete_flight',
      'get_most_recent_flight',
      'get_all_aircraft',
      'get_all_pilots',
      'check_user_admin_status',
      'fix_admin_access'
    ];

    // Use pg_catalog to check if our functions exist
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', functionsToCheck);

    if (error) {
      console.error('Error checking functions:', error);
      throw error;
    }

    const existingFunctions = data.map(row => row.proname);
    const missingFunctions = functionsToCheck.filter(fn => !existingFunctions.includes(fn));

    return new Response(
      JSON.stringify({ 
        success: true, 
        existingFunctions,
        missingFunctions,
        allFunctionsExist: missingFunctions.length === 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking RPC functions:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
