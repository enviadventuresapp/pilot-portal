
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { FlightSummaryOverview } from '@/components/flights/FlightSummaryOverview';
import { AircraftFlightSummary } from '@/components/flights/AircraftFlightSummary';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FlightSummary = () => {
  const { aircraftId } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Set up a realtime subscription for flight updates
  useRealtimeSubscription({
    table: 'flights',
    onInsert: () => {
      console.log('New flight detected in Flight Summary page');
    },
    onUpdate: () => {
      console.log('Flight updated detected in Flight Summary page');
    },
    onDelete: () => {
      console.log('Flight deletion detected in Flight Summary page');
    }
  });
  
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
          {aircraftId ? <AircraftFlightSummary aircraftId={aircraftId} /> : <FlightSummaryOverview />}
        </div>
      </main>
    </div>
  );
};

export default FlightSummary;
