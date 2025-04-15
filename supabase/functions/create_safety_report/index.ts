
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

    // Parse request body to get the report data
    const reportData = await req.json();
    
    // Extract reported_by from the request
    const reported_by = reportData.reporterName || reportData.reported_by || 'Anonymous';
    console.log(`Reporter name: ${reported_by}`);
    
    // Try to find if this reporter already exists in the pilot table
    let reporter_id = null;
    if (reported_by && reported_by !== 'Anonymous') {
      const { data: existingPilot, error: pilotError } = await supabase
        .from('pilots')
        .select('id')
        .eq('name', reported_by)
        .maybeSingle();
      
      if (pilotError) {
        console.error('Error checking for existing pilot:', pilotError);
      } else if (existingPilot) {
        reporter_id = existingPilot.id;
        console.log(`Found existing pilot with ID: ${reporter_id}`);
      } else {
        // Create a new pilot record if not found
        const { data: newPilot, error: createError } = await supabase
          .from('pilots')
          .insert([{ name: reported_by }])
          .select('id')
          .single();
          
        if (createError) {
          console.error('Error creating new pilot:', createError);
        } else if (newPilot) {
          reporter_id = newPilot.id;
          console.log(`Created new pilot with ID: ${reporter_id}`);
        }
      }
    }
    
    // Prepare the report data for insertion
    const safetyReport = {
      report_date: reportData.reportDate,
      reporter_id: reporter_id,
      reported_by: reported_by,
      category: reportData.category,
      description: reportData.description,
      severity: reportData.severity,
      status: reportData.status || 'submitted',
      actions: reportData.actions || '',
      location: reportData.location || '',
      aircraft_id: reportData.aircraftId !== 'none' ? reportData.aircraftId : null,
      admin_review: reportData.adminReview || null
    };
    
    console.log('Inserting safety report:', safetyReport);

    // Insert the safety report
    const { data, error } = await supabase
      .from('safety_reports')
      .insert([safetyReport])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating safety report:', error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in create_safety_report edge function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
