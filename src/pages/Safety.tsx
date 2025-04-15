import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SafetyList } from '@/components/safety/SafetyList';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const Safety = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isLoggedIn } = useAuthContext();
  const { toast } = useToast();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  // Use realtime subscription to detect changes to safety reports
  useRealtimeSubscription({
    table: 'safety_reports',
    onInsert: () => {
      console.log("Received INSERT event, refreshing safety data");
      refreshData();
    },
    onUpdate: () => {
      console.log("Received UPDATE event, refreshing safety data");
      refreshData();
    },
    onDelete: () => {
      console.log("Received DELETE event, refreshing safety data");
      refreshData();
    }
  });
  
  const refreshData = () => {
    console.log("Triggering safety data refresh");
    setIsLoading(true);
    // Increment refresh trigger to force SafetyList to refetch data
    setRefreshTrigger(prev => prev + 1);
    // Short timeout to ensure loading state is visible
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };
  
  // Simulate fast loading to avoid flash of content
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle document visibility changes to recheck data when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab is now visible, refreshing safety data');
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className={`pt-24 pb-16 px-4 sm:px-6 transition-all duration-300 ${
        isSidebarOpen ? 'sm:ml-64' : 'sm:ml-20'
      }`}>
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading safety data...</p>
              </div>
            </div>
          ) : (
            <SafetyList key={refreshTrigger} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Safety;
