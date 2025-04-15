import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PilotRecord } from '@/types';

interface AuthContextProps {
  user: PilotRecord | null;
  currentUser: PilotRecord | null; // Added currentUser property
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean, error?: any }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean, error?: any }>;
  logout: () => Promise<{ success: boolean, error?: any }>;
  refreshAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!initialized) {
        console.log('Auth context initialized');
        setInitialized(true);
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [initialized]);

  const refreshAdminStatus = async (): Promise<boolean> => {
    try {
      const { data, error } = await auth.checkAdminStatus();
      if (error) {
        console.error('Error refreshing admin status:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('Unexpected error refreshing admin status:', error);
      return false;
    }
  };

  const checkAdminStatus = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase.rpc('check_user_admin_status', {
        p_user_id: userId,
        p_email: userEmail
      });

      setIsAdmin(data === true);
      return data === true;
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
      return false;
    }
  };

  const contextValue = {
    ...auth,
    currentUser: auth.user, // Set currentUser to user
    refreshAdminStatus,
    checkAdminStatus
  };

  if (!initialized && auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
