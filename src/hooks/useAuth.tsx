import { useState, useEffect } from 'react';
import { supabase, initializeAuth } from '@/integrations/supabase/client';
import * as authService from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { PilotRecord } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<PilotRecord | null>(() => {
    try {
      const cachedUser = localStorage.getItem('pilot_portal_user');
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage:', e);
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const cachedUser = localStorage.getItem('pilot_portal_user');
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        return parsed?.isAdmin || false;
      }
    } catch (e) {
      console.warn('Failed to parse admin status from localStorage:', e);
    }
    return false;
  });
  
  const [sessionChecked, setSessionChecked] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let authStateSubscription: { unsubscribe: () => void } | null = null;
    
    const safetyTimer = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Auth initialization timed out after 5 seconds');
        setIsLoading(false);
        setSessionChecked(true);
        setInitialized(true);
      }
    }, 5000);

    const initializeAuthState = async () => {
      try {
        await initializeAuth();
        
        if (!mounted) return;
        
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event);
          
          if (event === 'SIGNED_IN' && session) {
            if (!mounted) return;
            
            setIsLoading(true);
            
            try {
              const isAdminStatus = await authService.checkAdminStatus();
              const currentUser = await authService.getCurrentUser();
              
              if (mounted) {
                setIsAdmin(isAdminStatus);
                setUser(currentUser);
                
                if (currentUser) {
                  try {
                    localStorage.setItem('pilot_portal_user', JSON.stringify(currentUser));
                  } catch (e) {
                    console.warn('Failed to store user in localStorage:', e);
                  }
                }
                
                setIsLoading(false);
                setSessionChecked(true);
                setInitialized(true);
              }
            } catch (e) {
              console.error('Error in auth state change handler:', e);
              if (mounted) {
                setUser(null);
                setIsAdmin(false);
                setIsLoading(false);
                setSessionChecked(true);
                setInitialized(true);
              }
            }
          }

          if (event === 'SIGNED_OUT') {
            if (mounted) {
              setUser(null);
              setIsAdmin(false);
              localStorage.removeItem('pilot_portal_user');
              setIsLoading(false);
              setSessionChecked(true);
              setInitialized(true);
            }
          }
        });

        authStateSubscription = data.subscription;

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError);
          if (mounted) {
            try {
              const cachedUser = localStorage.getItem('pilot_portal_user');
              if (cachedUser) {
                const parsedUser = JSON.parse(cachedUser);
                setUser(parsedUser);
                setIsAdmin(parsedUser.isAdmin);
              } else {
                setUser(null);
                setIsAdmin(false);
              }
            } catch (e) {
              console.warn('Failed to read user from localStorage:', e);
              setUser(null);
              setIsAdmin(false);
            }
            
            setIsLoading(false);
            setSessionChecked(true);
            setInitialized(true);
          }
          return;
        }

        if (session) {
          try {
            const isAdminStatus = await authService.checkAdminStatus();
            const currentUser = await authService.getCurrentUser();
            
            if (mounted) {
              setIsAdmin(isAdminStatus);
              setUser(currentUser);
              
              if (currentUser) {
                try {
                  localStorage.setItem('pilot_portal_user', JSON.stringify(currentUser));
                } catch (e) {
                  console.warn('Failed to store user in localStorage:', e);
                }
              }
            }
          } catch (error) {
            console.error('Error getting initial user data:', error);
            try {
              const cachedUser = localStorage.getItem('pilot_portal_user');
              if (cachedUser && mounted) {
                const parsedUser = JSON.parse(cachedUser);
                setUser(parsedUser);
                setIsAdmin(parsedUser.isAdmin);
              } else if (mounted) {
                setUser(null);
                setIsAdmin(false);
              }
            } catch (e) {
              console.warn('Failed to read user from localStorage:', e);
              if (mounted) {
                setUser(null);
                setIsAdmin(false);
              }
            }
          }
        } else {
          try {
            const cachedUser = localStorage.getItem('pilot_portal_user');
            if (cachedUser && mounted) {
              const parsedUser = JSON.parse(cachedUser);
              setUser(parsedUser);
              setIsAdmin(parsedUser.isAdmin);
            } else if (mounted) {
              setUser(null);
              setIsAdmin(false);
            }
          } catch (e) {
            console.warn('Failed to read user from localStorage:', e);
            if (mounted) {
              setUser(null);
              setIsAdmin(false);
            }
          }
        }

        if (mounted) {
          setIsLoading(false);
          setSessionChecked(true);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        if (mounted) {
          setIsLoading(false);
          setSessionChecked(true);
          setInitialized(true);
        }
      }
    };

    initializeAuthState();
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab is now visible, refreshing session');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const isAdminStatus = await authService.checkAdminStatus();
            const currentUser = await authService.getCurrentUser();
            
            if (mounted) {
              setIsAdmin(isAdminStatus);
              setUser(currentUser);
              
              if (currentUser) {
                try {
                  localStorage.setItem('pilot_portal_user', JSON.stringify(currentUser));
                } catch (e) {
                  console.warn('Failed to store user in localStorage:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading]);

  const checkAdminStatus = async () => {
    return await authService.checkAdminStatus();
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error };
      }

      const isAdminStatus = await authService.checkAdminStatus();
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(isAdminStatus);
        try {
          localStorage.setItem('pilot_portal_user', JSON.stringify(currentUser));
        } catch (e) {
          console.warn('Failed to store user in localStorage:', e);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { success: false, error };
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
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
        console.error('Registration error:', error);
        return { success: false, error };
      }

      const isAdminStatus = await authService.checkAdminStatus();
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(isAdminStatus);
        try {
          localStorage.setItem('pilot_portal_user', JSON.stringify(currentUser));
        } catch (e) {
          console.warn('Failed to store user in localStorage:', e);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected registration error:', error);
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        return { success: false, error };
      }

      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('pilot_portal_user');

      return { success: true };
    } catch (error) {
      console.error('Unexpected logout error:', error);
      return { success: false, error };
    }
  };

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    isAdmin,
    login,
    register,
    logout,
    checkAdminStatus,
  };
}
