
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PilotRoster } from '@/components/maintenance/PilotRoster';
import { AircraftMaintenance } from '@/components/maintenance/AircraftMaintenance';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PilotRecord, Flight } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePilots } from '@/hooks/usePilots';
import { checkIsAdmin } from '@/utils/isAdmin';

const Maintenance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser] = useLocalStorage<PilotRecord | null>('currentUser', null);
  const [flights] = useLocalStorage<Flight[]>('flights', []);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  
  // Use the usePilots hook to get access to pilots data
  const { pilots } = usePilots();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  
  // Update current user whenever pilots change
  useEffect(() => {
    const checkAdmin = async () => {
      setIsAdmin(await checkIsAdmin());
    };
    checkAdmin();
    if (currentUser && pilots.length > 0) {
      const updatedUser = pilots.find(p => p.id === currentUser.id);
      if (updatedUser) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } else if (!currentUser && pilots.length > 0) {
      localStorage.setItem('currentUser', JSON.stringify(pilots[0]));
    }
  }, [pilots, currentUser]);
  
  // Display a message for non-admin users
  const showAdminMessage = () => {
    if (!isAdmin) {
      toast({
        title: "Limited Access",
        description: "You have view-only access to maintenance records. Contact an administrator for editing privileges.",
        duration: 5000,
      });
    }
  };
  
  // Show the admin message when the component mounts
  useEffect(() => {
    if (currentUser && !isAdmin) {
      showAdminMessage();
    }
  }, [currentUser, isAdmin]);
  
  return (
    <div className="min-h-screen bg-background">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={function (): void {
        throw new Error('Function not implemented.');
      } } />
      
      <main className={`pt-24 pb-16 px-4 sm:px-6 transition-all duration-300 ${
        isSidebarOpen ? 'sm:ml-64' : 'sm:ml-20'
      }`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Maintenance</h1>
          
          <div className="grid gap-6">
            <div>
              <AircraftMaintenance isUserAdmin={isAdmin} />
            </div>
            
            <div>
              <PilotRoster isAdmin={isAdmin}/>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Maintenance;
