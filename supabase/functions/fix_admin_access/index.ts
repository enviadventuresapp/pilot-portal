
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
    const { email, user_id, name } = await req.json();
    
    if (!email || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and user_id are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fixing admin access for email: ${email}, user_id: ${user_id}`);

    // Check if the target user is the one specified in the request
    if (email === 'enviadventures@gmail.com' || user_id === '0c3fa5a4-b564-4b55-8186-df7ee977b497') {
      console.log('Found special user for admin privileges');
    }

    // Check if pilot exists
    const { data: existingPilot, error: checkError } = await supabase
      .from('pilots')
      .select('*')
      .or(`email.eq.${email},user_id.eq.${user_id}`)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing pilot:', checkError);
      throw checkError;
    }

    if (existingPilot) {
      console.log('Existing pilot found:', existingPilot);
      
      // Update the existing pilot to ensure admin status
      const { error: updateError } = await supabase
        .from('pilots')
        .update({
          is_admin: true,
          user_id: user_id,
          email: email // Ensure email is updated in case it was missing
        })
        .eq('id', existingPilot.id);

      if (updateError) {
        console.error('Error updating pilot:', updateError);
        throw updateError;
      }

      // Link the pilot to the user profile if needed
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Error checking for existing profile:', profileCheckError);
        throw profileCheckError;
      }

      if (existingProfile) {
        // Update existing profile
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            pilot_id: existingPilot.id
          })
          .eq('id', existingProfile.id);

        if (profileUpdateError) {
          console.error('Error updating profile:', profileUpdateError);
          throw profileUpdateError;
        }
      } else {
        // Create new profile
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: user_id,
            user_id: user_id,
            pilot_id: existingPilot.id
          });

        if (profileInsertError) {
          console.error('Error creating profile:', profileInsertError);
          throw profileInsertError;
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Admin access confirmed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No existing pilot found, creating new admin pilot');
      // Create a new pilot record with admin privileges
      const { data: newPilot, error: insertError } = await supabase
        .from('pilots')
        .insert({
          name: name || email.split('@')[0],
          email: email,
          is_admin: true,
          is_hidden: false,
          user_id: user_id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating admin pilot:', insertError);
        throw insertError;
      }

      console.log('New pilot created:', newPilot);

      // Link the pilot to the user profile if needed
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Error checking for existing profile:', profileCheckError);
        throw profileCheckError;
      }

      if (existingProfile) {
        // Update existing profile
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            pilot_id: newPilot.id
          })
          .eq('id', existingProfile.id);

        if (profileUpdateError) {
          console.error('Error updating profile:', profileUpdateError);
          throw profileUpdateError;
        }
      } else {
        // Create new profile
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: user_id,
            user_id: user_id,
            pilot_id: newPilot.id
          });

        if (profileInsertError) {
          console.error('Error creating profile:', profileInsertError);
          throw profileInsertError;
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Admin access granted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in fix_admin_access:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
