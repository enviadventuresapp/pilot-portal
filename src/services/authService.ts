import { supabase } from '@/integrations/supabase/client';
import { PilotRecord } from '@/types';
import { GENERAL_ADMIN_USER_ID } from '@/utils/isAdmin';

// Initialize auth state
let currentSession = null;

supabase.auth.onAuthStateChange((event, session) => {
  currentSession = session;
});

interface AuthError {
  message: string;
}

interface AuthResponse {
  user?: PilotRecord;
  error?: AuthError;
}

const ADMIN_USER_ID = GENERAL_ADMIN_USER_ID;

/**
 * Convert database pilot to application pilot
 */
function dbToAppPilot(dbPilot: any): PilotRecord {
  return {
    id: dbPilot.id,
    user_id: dbPilot.user_id,
    name: dbPilot.name,
    email: dbPilot.email,
    isAdmin: dbPilot.is_admin || false,
    isHidden: dbPilot.is_hidden || false,
    created_at: dbPilot.created_at,
    updated_at: dbPilot.updated_at || dbPilot.created_at
  };
}

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
  try {
    console.log("Signing in with:", email);
    
    // Add a short delay to ensure Supabase connection is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error("Auth error:", authError);
      return { error: { message: authError.message } };
    }

    if (!authData.user) {
      console.error("No user data returned from auth");
      return { error: { message: 'Authentication successful but no user data returned' } };
    }

    console.log("Auth successful for user ID:", authData.user.id);

    // Add a small delay to ensure the authentication state is fully established
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Get pilot data based on auth user ID
      const { data: pilotData, error: pilotError } = await supabase
        .from('pilots')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (pilotError) {
        console.error('Error getting pilot data:', pilotError);
        
        // If pilot data doesn't exist, create it for this user
        console.log('Creating new pilot record for user:', authData.user.id);
        
        // Create a retry mechanism for creating the pilot record
        let retryAttempts = 3;
        let newPilotData = null;
        let newPilotError = null;
        
        while (retryAttempts > 0 && !newPilotData) {
          try {
            const newPilot = {
              user_id: authData.user.id,
              name: authData.user.user_metadata.full_name || email.split('@')[0],
              email: email,
              is_admin: false,
              is_hidden: false,
            };

            const { data, error } = await supabase
              .from('pilots')
              .insert(newPilot)
              .select('*')
              .single();
              
            if (error) {
              console.error(`Error creating pilot record (attempt ${4-retryAttempts}/3):`, error);
              newPilotError = error;
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              newPilotData = data;
              break;
            }
          } catch (err) {
            console.error(`Error in pilot creation attempt ${4-retryAttempts}/3:`, err);
          }
          retryAttempts--;
        }

        if (!newPilotData) {
          console.error('All attempts to create pilot record failed:', newPilotError);
          // Return the user anyway to allow login, just with limited data
          return { 
            user: {
              id: authData.user.id,
              user_id: authData.user.id,
              name: authData.user.user_metadata.full_name || email.split('@')[0],
              email: email,
              isAdmin: false,
              isHidden: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } 
          };
        }

        console.log("New pilot record created:", newPilotData);
        return {
          user: dbToAppPilot(newPilotData)
        };
      }

      console.log("Found existing pilot record:", pilotData);
      // Return user data with pilot data
      return {
        user: dbToAppPilot(pilotData)
      };
    } catch (error) {
      console.error('Error getting pilot data during sign in:', error);
      // Return the user anyway to allow login, just with limited data
      return { 
        user: {
          id: authData.user.id,
          user_id: authData.user.id,
          name: authData.user.user_metadata.full_name || email.split('@')[0],
          email: email,
          isAdmin: false,
          isHidden: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } 
      };
    }
  } catch (error) {
    console.error('Error signing in:', error);
    return { 
      error: error instanceof Error 
        ? { message: error.message } 
        : { message: 'Unknown error during sign in' } 
    };
  }
};

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
  try {
    console.log("Attempting signup for:", email);
    
    // Check if pilot already exists
    const { data: existingPilot, error: checkError } = await supabase
      .from('pilots')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing pilot:", checkError);
      return { error: { message: 'Error checking if account exists' } };
    }

    if (existingPilot) {
      console.log("Pilot already exists with email:", email);
      return { error: { message: 'An account with this email already exists' } };
    }

    const { data: auth, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      return { error: { message: signUpError.message } };
    }

    if (!auth.user) {
      console.error("No user data returned from signup");
      return { error: { message: 'No user data returned' } };
    }

    console.log("Auth signup successful for user ID:", auth.user.id);

    // Create pilot record
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .insert({
        user_id: auth.user.id,
        email: email,
        name: fullName,
        is_admin: false,
        is_hidden: false,
      })
      .select()
      .single();

    if (pilotError) {
      console.error('Error creating pilot record:', pilotError);
      return { error: { message: 'Failed to create pilot record' } };
    }

    console.log("New pilot record created on signup:", pilot);
    return { user: dbToAppPilot(pilot) };
  } catch (error) {
    console.error('Error in signUp:', error);
    return { error: { message: 'Failed to sign up' } };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error?: AuthError }> {
  try {
    console.log("Signing out user");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      return { error: { message: error.message } };
    }
    console.log("User signed out successfully");
    return {};
  } catch (error) {
    console.error('Error in signOut:', error);
    return { error: { message: 'An unexpected error occurred during sign out' } };
  }
}

/**
 * Get the current user
 */
export const getCurrentUser = async (): Promise<PilotRecord | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const isAdmin = user.id === ADMIN_USER_ID;

    return {
      id: user.id,
      user_id: user.id,
      name: user.user_metadata?.full_name || user.email || '',
      email: user.email || '',
      isAdmin,
      isHidden: false,
      created_at: user.created_at,
      updated_at: user.last_sign_in_at || user.created_at,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error };
  }
};

/**
 * Update user profile
 */
export async function updateProfile(userId: string, userData: Partial<PilotRecord>): Promise<{ error?: AuthError }> {
  try {
    const { error } = await supabase
      .from('pilots')
      .update({
        name: userData.name,
        email: userData.email,
        is_admin: userData.isAdmin,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating profile:', error);
      return { error: { message: error.message } };
    }
    return {};
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return { error: { message: 'An unexpected error occurred while updating profile' } };
  }
}

/**
 * Create a pilot record for a user that doesn't have one
 */
export const createPilotRecord = async (userId: string, userData: Partial<PilotRecord>) => {
  try {
    const { data, error } = await supabase
      .from('pilots')
      .insert({
        user_id: userId,
        name: userData.name || 'New Pilot',
        email: userData.email || '',
        is_admin: userData.isAdmin || false,
        is_hidden: userData.isHidden || false
      })
      .select()
      .single();

    if (error) throw error;

    return { 
      success: true, 
      pilot: dbToAppPilot(data)
    };
  } catch (error) {
    console.error('Error creating pilot record:', error);
    return { success: false, error };
  }
};

/**
 * Get a user by ID
 */
export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return { user: dbToAppPilot(data) };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

export const checkAdminStatus = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id === ADMIN_USER_ID;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
