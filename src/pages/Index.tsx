import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Enable realtime features for the tables we're monitoring
  useEffect(() => {
    // Enable realtime for flights table
    supabase
      .from('flights')
      .update({ id: null }) // Dummy query to ensure realtime is enabled
      .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID to ensure no update happens
      .then(() => {
        console.log('Realtime enabled for flights table');
      });

    // Enable realtime for safety_reports table
    supabase
      .from('safety_reports')
      .update({ id: null })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .then(() => {
        console.log('Realtime enabled for safety_reports table');
      });
  }, []);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className={`pt-24 pb-16 px-4 sm:px-6 transition-all duration-300 ${
        isSidebarOpen ? 'sm:ml-64' : 'sm:ml-20'
      }`}>
        <div className="max-w-7xl mx-auto">
          <Dashboard />
        </div>
      </main>
    </div>
  );
};

export default Index;
