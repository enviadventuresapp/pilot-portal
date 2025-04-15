
import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures that a user with the specified email is set as an admin
 * This can be called during development to fix admin access issues
 */
export const ensureAdminAccess = async (email: string) => {
  try {
    // First check if user already exists in pilots table by email
    const { data: existingPilot, error: checkError } = await supabase
      .from('pilots')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing pilot:', checkError);
      return { success: false, error: checkError };
    }
    
    // Get the auth user to get the user_id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      return { success: false, error: userError };
    }
    
    if (!user) {
      console.error('No authenticated user found');
      return { success: false, error: { message: 'No authenticated user found' } };
    }
    
    if (existingPilot) {
      // Update the existing pilot to ensure admin status and link user_id
      const { data, error: updateError } = await supabase.functions.invoke('fix_admin_access', {
        body: { email, user_id: user.id }
      });
      
      if (updateError) {
        console.error('Error updating pilot:', updateError);
        return { success: false, error: updateError };
      }
      
      return { success: true, message: 'Admin access confirmed' };
    } else {
      // Create a new pilot record with admin privileges
      const newPilot = {
        name: user.user_metadata?.full_name || email.split('@')[0],
        email: email,
        is_admin: true,
        is_hidden: false,
        user_id: user.id
      };
      
      // Insert pilot with admin privileges
      const { data, error: insertError } = await supabase.functions.invoke('fix_admin_access', {
        body: { 
          email, 
          user_id: user.id,
          name: newPilot.name
        }
      });
      
      if (insertError) {
        console.error('Error creating admin pilot:', insertError);
        return { success: false, error: insertError };
      }
      
      return { success: true, message: 'Admin access granted' };
    }
  } catch (error) {
    console.error('Error in ensureAdminAccess:', error);
    return { success: false, error };
  }
};
