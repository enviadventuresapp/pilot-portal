
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

    // Parse request body to get the report ID
    const requestData = await req.json();
    const { id } = requestData;

    if (!id) {
      throw new Error('Report ID is required');
    }

    console.log(`Fetching safety report with ID: ${id}`);
    
    // Get the safety report with reported_by field
    const { data: report, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error in get_safety_report_by_id edge function:', error);
      throw error;
    }

    // If we got the report, fetch the reporter name if not already available
    if (report && report.reporter_id && !report.reported_by) {
      const { data: reporter, error: reporterError } = await supabase
        .from('pilots')
        .select('name')
        .eq('id', report.reporter_id)
        .single();
        
      if (!reporterError && reporter) {
        report.reported_by = reporter.name;
      } else {
        report.reported_by = 'Unknown';
      }
    }
    
    // Map reported_by to reporter_name for UI consistency
    if (report) {
      report.reporter_name = report.reported_by;
    }

    // If we have an aircraft ID, get aircraft details
    if (report && report.aircraft_id) {
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('tail_number, make, model')
        .eq('id', report.aircraft_id)
        .single();
        
      if (!aircraftError && aircraft) {
        report.aircraft_details = aircraft;
      }
    }

    console.log(`Successfully fetched report: ${id}`);

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error in get_safety_report_by_id edge function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      },
      status: 500,
    });
  }
});
