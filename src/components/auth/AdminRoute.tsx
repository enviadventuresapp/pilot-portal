
import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { PageSkeletonLoader } from '@/components/ui/page-skeleton';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isLoggedIn, isLoading, isAdmin } = useAuthContext();
  const location = useLocation();
  const { toast } = useToast();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showLoadingUI, setShowLoadingUI] = useState(false);

  // Add a timeout to prevent indefinite loading
  useEffect(() => {
    let mounted = true;
    
    // Show loading UI after a short delay to prevent flash
    const uiTimer = setTimeout(() => {
      if (mounted && isLoading) {
        setShowLoadingUI(true);
      }
    }, 200);
    
    const timer = setTimeout(() => {
      if (mounted && isLoading) {
        setLoadingTimeout(true);
        console.warn("Admin auth check timed out after 5 seconds");
      }
    }, 5000); // 5 seconds timeout

    return () => {
      mounted = false;
      clearTimeout(timer);
      clearTimeout(uiTimer);
    };
  }, [isLoading]);

  // Show a timeout message and redirect to login if loading takes too long
  if (isLoading && loadingTimeout) {
    // Try to recover from local storage
    const cachedUser = localStorage.getItem('pilot_portal_user');
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        if (user.isAdmin) {
          return <>{children}</>;
        }
      } catch (e) {
        console.error('Error parsing cached user:', e);
      }
    }
    
    toast({
      title: "Authentication timeout",
      description: "Authentication is taking longer than expected. Redirecting to login page.",
      variant: "destructive",
    });
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading && showLoadingUI) {
    return <LoadingSpinner type="skeleton" height="500px" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    toast({
      title: "Access Restricted",
      description: "You do not have administrator privileges to access this page.",
      variant: "destructive",
    });
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
