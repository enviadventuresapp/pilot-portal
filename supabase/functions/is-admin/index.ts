
// This is an Edge Function that checks if the current user is an admin
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // Get the user from the auth context
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    // If no user is found, return an error
    if (!user) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Not authenticated' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }
    
    console.log("User found. Checking admin status for:", user.email);

    // Create a service role client to bypass RLS
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Use parameterized query to avoid SQL injection
    const { data, error } = await adminClient
      .from('pilots')
      .select('is_admin')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .limit(1)
      .single();
    
    if (error) {
      console.error("Error checking admin status:", error);
      return new Response(
        JSON.stringify({ isAdmin: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const isAdmin = data ? !!data.is_admin : false;
    console.log("Admin status result:", isAdmin);
    
    // Return admin status
    return new Response(
      JSON.stringify({ isAdmin }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return new Response(
      JSON.stringify({ isAdmin: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
