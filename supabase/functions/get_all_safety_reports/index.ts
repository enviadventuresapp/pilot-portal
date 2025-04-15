
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching all safety reports from edge function");
    
    // Update query to match actual database schema - using reported_by instead of reporter_name
    const { data, error } = await supabase
      .from('safety_reports')
      .select(`
        id,
        report_date,
        reporter_id,
        reported_by,
        category,
        description,
        severity,
        status,
        actions,
        location,
        aircraft_id,
        admin_review,
        created_at,
        updated_at
      `)
      .order('report_date', { ascending: false });

    if (error) {
      console.error('Error in get_all_safety_reports edge function:', error);
      throw error;
    }

    console.log(`Got ${data?.length || 0} safety reports`);

    // Join with pilots table to get reporter names for reports with reporter_id
    if (data && data.length > 0) {
      // Get unique reporter IDs
      const reporterIds = [...new Set(data.map(report => report.reporter_id).filter(Boolean))];
      
      if (reporterIds.length > 0) {
        // Fetch pilots data for these IDs
        const { data: pilots, error: pilotsError } = await supabase
          .from('pilots')
          .select('id, name')
          .in('id', reporterIds);
          
        if (pilotsError) {
          console.error('Error fetching pilot data:', pilotsError);
        } else if (pilots) {
          // Create a lookup map for pilot names
          const pilotMap = pilots.reduce((acc, pilot) => {
            acc[pilot.id] = pilot.name;
            return acc;
          }, {} as Record<string, string>);
          
          // Add reporter names to reports
          data.forEach(report => {
            // Use reported_by if available, otherwise use pilot name from lookup
            if (!report.reported_by && report.reporter_id && pilotMap[report.reporter_id]) {
              report.reported_by = pilotMap[report.reporter_id];
            } else if (!report.reported_by) {
              report.reported_by = 'Unknown';
            }
            
            // Map the reported_by to reporterName for UI consistency
            report.reporter_name = report.reported_by;
          });
        }
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error in get_all_safety_reports edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
      status: 500,
    });
  }
});
