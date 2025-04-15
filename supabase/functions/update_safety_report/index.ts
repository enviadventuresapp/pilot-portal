
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
    const { id, reportData } = await req.json();
    
    if (!id) {
      throw new Error('Report ID is required');
    }
    
    console.log(`Updating safety report with ID: ${id}`);
    console.log('Update data:', reportData);
    
    // Prepare the update data
    const updateData: Record<string, any> = {
      report_date: reportData.reportDate,
      category: reportData.category,
      description: reportData.description,
      severity: reportData.severity,
      status: reportData.status || 'submitted',
      updated_at: new Date().toISOString()
    };
    
    // Optional fields
    if (reportData.reporterName) updateData.reported_by = reportData.reporterName;
    if (reportData.actions !== undefined) updateData.actions = reportData.actions;
    if (reportData.location !== undefined) updateData.location = reportData.location;
    if (reportData.aircraftId !== undefined && reportData.aircraftId !== 'none') {
      updateData.aircraft_id = reportData.aircraftId;
    } else {
      updateData.aircraft_id = null;
    }
    
    // Handle admin review data
    if (reportData.adminReview) {
      updateData.admin_review = reportData.adminReview;
    }

    // Update the safety report
    const { data, error } = await supabase
      .from('safety_reports')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating safety report:', error);
      throw error;
    }

    console.log('Successfully updated safety report');

    return new Response(JSON.stringify({ success: true, report: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in update_safety_report edge function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
