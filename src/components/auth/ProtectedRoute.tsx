
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoggedIn, isLoading } = useAuthContext();
  const location = useLocation();
  const { toast } = useToast();
  const [showLoadingUI, setShowLoadingUI] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Only show loading UI after a short delay to prevent flashing
  useEffect(() => {
    let mounted = true;
    
    // Quick timer for showing loading UI
    const uiTimer = setTimeout(() => {
      if (mounted && isLoading) {
        setShowLoadingUI(true);
      }
    }, 200);
    
    // Long timer for timeout handling
    const timeoutTimer = setTimeout(() => {
      if (mounted && isLoading) {
        setLoadingTimeout(true);
        console.warn("Auth loading timed out after 5 seconds");
      }
    }, 5000);
    
    return () => {
      mounted = false;
      clearTimeout(uiTimer);
      clearTimeout(timeoutTimer);
    };
  }, [isLoading]);
  
  // Use useEffect for side effects like showing toasts
  useEffect(() => {
    // Only show the toast if the user is not logged in and we've confirmed they're not loading
    if (!isLoggedIn && !isLoading && location.pathname !== '/login') {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to access this page.",
        variant: "destructive"
      });
    }
  }, [isLoggedIn, isLoading, location.pathname, toast]);
  
  // Handle timeout scenario
  if (loadingTimeout) {
    // Try to recover from localStorage if possible
    const cachedUser = localStorage.getItem('pilot_portal_user');
    if (cachedUser) {
      return <>{children}</>;
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only show loading state if it persists for more than the delay
  if (isLoading && showLoadingUI) {
    return (
      <div className="animate-fade-in w-full max-w-7xl mx-auto px-4 py-8">
        <LoadingSpinner type="skeleton" height="500px" />
      </div>
    );
  }

  if (!isLoading && !isLoggedIn) {
    // Save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
