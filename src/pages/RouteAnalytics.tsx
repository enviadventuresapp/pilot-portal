
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Flight, RouteTargetTime } from '@/types';
import { RouteAnalyticsContent } from '@/components/analytics/RouteAnalyticsContent';
import { Target } from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { getAllFlights } from '@/services/flightService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RouteAnalytics = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [targets, setTargets] = useState<RouteTargetTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Set up a realtime subscription for flight updates
  useRealtimeSubscription({
    table: 'flights',
    onInsert: (newFlight) => {
      console.log('New flight added in Route Analytics:', newFlight);
      setFlights(prevFlights => {
        // Check if flight with this ID already exists (avoid duplicates)
        const exists = prevFlights.some(flight => flight.id === newFlight.id);
        if (exists) return prevFlights;
        return [...prevFlights, {
          id: newFlight.id,
          aircraftId: newFlight.aircraft_id,
          pilotId: newFlight.pilot_id,
          date: newFlight.date,
          tachStart: newFlight.tach_start,
          tachEnd: newFlight.tach_end,
          hobbsTime: newFlight.hobbs_time,
          fuelAdded: newFlight.fuel_added,
          oilAdded: newFlight.oil_added,
          passengerCount: newFlight.passenger_count,
          route: newFlight.route,
          squawks: newFlight.squawks,
          notes: newFlight.notes,
          createdAt: newFlight.created_at,
          updatedAt: newFlight.updated_at,
          category: newFlight.category,
          departureTime: newFlight.departure_time,
          pilotName: newFlight.pilot_name
        }];
      });
      toast.success('New flight data received');
    },
    onUpdate: (updatedFlight) => {
      console.log('Flight updated in Route Analytics:', updatedFlight);
      setFlights(prevFlights => 
        prevFlights.map(flight => flight.id === updatedFlight.id ? {
          id: updatedFlight.id,
          aircraftId: updatedFlight.aircraft_id,
          pilotId: updatedFlight.pilot_id,
          date: updatedFlight.date,
          tachStart: updatedFlight.tach_start,
          tachEnd: updatedFlight.tach_end,
          hobbsTime: updatedFlight.hobbs_time,
          fuelAdded: updatedFlight.fuel_added,
          oilAdded: updatedFlight.oil_added,
          passengerCount: updatedFlight.passenger_count,
          route: updatedFlight.route,
          squawks: updatedFlight.squawks,
          notes: updatedFlight.notes,
          createdAt: updatedFlight.created_at,
          updatedAt: updatedFlight.updated_at,
          category: updatedFlight.category,
          departureTime: updatedFlight.departure_time,
          pilotName: updatedFlight.pilot_name
        } : flight)
      );
    },
    onDelete: (deletedFlight) => {
      console.log('Flight deleted in Route Analytics:', deletedFlight);
      setFlights(prevFlights => 
        prevFlights.filter(flight => flight.id !== deletedFlight.id)
      );
    }
  });

  // Set up a realtime subscription for route target updates
  useRealtimeSubscription({
    table: 'route_target_times',
    onInsert: (newTarget) => {
      console.log('New route target added:', newTarget);
      setTargets(prevTargets => {
        const exists = prevTargets.some(target => target.id === newTarget.id);
        if (exists) return prevTargets;
        return [...prevTargets, {
          id: newTarget.id,
          route: newTarget.route,
          targetTime: newTarget.target_time,
          aircraftId: newTarget.aircraft_id || null,
          pilotId: newTarget.pilot_id || null,
          month: newTarget.month || null,
          year: newTarget.year || null,
          createdAt: newTarget.created_at,
          updatedAt: newTarget.updated_at
        }];
      });
      toast.success('New route target added');
    },
    onUpdate: (updatedTarget) => {
      console.log('Route target updated:', updatedTarget);
      setTargets(prevTargets => 
        prevTargets.map(target => target.id === updatedTarget.id ? {
          id: updatedTarget.id,
          route: updatedTarget.route,
          targetTime: updatedTarget.target_time,
          aircraftId: updatedTarget.aircraft_id || null,
          pilotId: updatedTarget.pilot_id || null,
          month: updatedTarget.month || null,
          year: updatedTarget.year || null,
          createdAt: updatedTarget.created_at,
          updatedAt: updatedTarget.updated_at
        } : target)
      );
      toast.info('Route target updated');
    },
    onDelete: (deletedTarget) => {
      console.log('Route target deleted:', deletedTarget);
      setTargets(prevTargets => 
        prevTargets.filter(target => target.id !== deletedTarget.id)
      );
      toast.info('Route target removed');
    }
  });
  
  // Fetch initial flight and target data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch flights
        const { success, flights: fetchedFlights, error } = await getAllFlights();
        if (success && fetchedFlights) {
          console.log(`Fetched ${fetchedFlights.length} flights for route analytics`);
          setFlights(fetchedFlights);
        } else if (error) {
          console.error('Error fetching flights for route analytics:', error);
          toast.error('Failed to load flight data');
        }
        
        // Fetch route target times
        const { data: targetData, error: targetError } = await supabase
          .from('route_target_times')
          .select('*')
          .limit(100);
        
        if (targetError) {
          console.error('Error fetching route targets:', targetError);
          toast.error('Failed to load route targets');
        } else if (targetData) {
          console.log(`Fetched ${targetData.length} route targets`);
          
          const formattedTargets: RouteTargetTime[] = targetData.map(item => ({
            id: item.id,
            route: item.route,
            targetTime: item.target_time,
            aircraftId: item.aircraft_id || null,
            pilotId: item.pilot_id || null,
            month: item.month || null,
            year: item.year || null,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          }));
          
          setTargets(formattedTargets);
        }
      } catch (error) {
        console.error('Error fetching data for route analytics:', error);
        toast.error('Failed to load route data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
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
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Route Analytics</h1>
          </div>
          
          <div className="grid gap-6">
            <RouteAnalyticsContent 
              flights={flights} 
              targets={targets}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RouteAnalytics;
