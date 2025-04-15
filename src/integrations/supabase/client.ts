
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
});

// Initialize auth state
let initialized = false;
let refreshTimeout: NodeJS.Timeout | null = null;
let initPromise: Promise<void> | null = null;

export const initializeAuth = async () => {
  // Return existing promise if already initializing
  if (initPromise) return initPromise;
  
  // Return immediately if already initialized
  if (initialized) return Promise.resolve();
  
  // Create a new initialization promise
  initPromise = new Promise<void>(async (resolve) => {
    try {
      console.log("Initializing Supabase auth...");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error initializing auth:', error);
        // Even if there's an error, mark as initialized to avoid getting stuck
        initialized = true;
        resolve();
        return;
      }
      
      if (session) {
        setupSessionRefresh(session);
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN' && session) {
          setupSessionRefresh(session);
        }
        if (event === 'SIGNED_OUT') {
          if (refreshTimeout) {
            clearTimeout(refreshTimeout);
            refreshTimeout = null;
          }
        }
      });

      // Cleanup function
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          subscription.unsubscribe();
          if (refreshTimeout) {
            clearTimeout(refreshTimeout);
          }
        });
      }
    } catch (error) {
      console.error('Error in auth initialization:', error);
    } finally {
      // Always mark as initialized to prevent getting stuck
      initialized = true;
      initPromise = null;
      resolve();
    }
  });
  
  // Add a timeout to ensure initialization doesn't hang indefinitely
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (!initialized) {
        console.warn('Auth initialization timed out after 3 seconds');
        initialized = true;
        resolve();
      }
    }, 3000); // 3 second timeout
  });
  
  // Race between normal initialization and timeout
  return Promise.race([initPromise, timeoutPromise]);
};

function setupSessionRefresh(session: any) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  const timeNow = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  const timeUntilExpire = expiresAt - timeNow;
  
  if (timeUntilExpire > 0) {
    refreshTimeout = setTimeout(async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Error refreshing session:', error);
          // Force sign out if refresh fails
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Error in session refresh:', error);
      }
    }, (timeUntilExpire - 60) * 1000); // Refresh 1 minute before expiry
  }
}

// Call initialize when the client is imported
initializeAuth().catch(err => {
  console.error("Failed to initialize auth:", err);
});

// Function to create a new user account with admin privileges
export const createAdminUser = async (email: string, password: string, fullName: string) => {
  try {
    // First, check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('pilots')
      .select('*')
      .eq('email', email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    // Create the user account in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      throw error;
    }
    
    // Link the user account to the pilot record in the profiles table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          user_id: data.user.id,
          pilot_id: existingUsers?.id // Link to existing pilot record
        });
        
      if (profileError) {
        console.error("Error linking profile:", profileError);
      }
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Error creating admin user:", error);
    return { success: false, error };
  }
};
