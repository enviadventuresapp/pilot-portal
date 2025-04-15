
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Flight } from '@/types';
import { format } from 'date-fns';
import { AlertCircle, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export function FlightsAdmin() {
  const { toast } = useToast();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch flights from the database
  useEffect(() => {
    const fetchFlights = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching flights for admin dashboard...");
        
        // Call the Edge Function to avoid RLS recursion issues
        const { data, error } = await supabase.functions.invoke('get_all_flights');
        
        if (error) {
          console.error('Error invoking get_all_flights edge function:', error);
          setError('Failed to load flight data. Please try again.');
          return;
        }
        
        if (!data) {
          console.error('No data returned from get_all_flights edge function');
          setError('No data returned from server');
          return;
        }
        
        console.log("Received flight data:", data);
        
        // Transform the data into Flight objects
        const flightsData = data.map((flight: any) => ({
          id: flight.id,
          aircraftId: flight.aircraft_id,
          pilotId: flight.pilot_id,
          date: flight.date,
          tachStart: flight.tach_start,
          tachEnd: flight.tach_end,
          hobbsTime: flight.hobbs_time,
          fuelAdded: flight.fuel_added,
          oilAdded: flight.oil_added,
          passengerCount: flight.passenger_count,
          route: flight.route,
          squawks: flight.squawks,
          notes: flight.notes,
          category: flight.category,
          departureTime: flight.departure_time,
          pilotName: flight.pilot_name
        }));
        
        setFlights(flightsData);
      } catch (err) {
        console.error('Exception fetching flights:', err);
        setError('Failed to load flight data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFlights();
  }, []);
  
  // Filter flights based on search term
  const filteredFlights = flights.filter((flight) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      flight.pilotName?.toLowerCase().includes(searchLower) ||
      flight.route?.toLowerCase().includes(searchLower) ||
      flight.category?.toLowerCase().includes(searchLower) ||
      flight.notes?.toLowerCase().includes(searchLower) ||
      flight.squawks?.toLowerCase().includes(searchLower)
    );
  });
  
  const handleRefresh = () => {
    setFlights([]);
    setIsLoading(true);
    setError(null);
    
    // Re-fetch the flights
    supabase.functions.invoke('get_all_flights')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error refreshing flight data:', error);
          setError('Failed to load flight data. Please try again.');
          return;
        }
        
        if (!data) {
          setError('No data returned from server');
          return;
        }
        
        // Transform the data into Flight objects
        const flightsData = data.map((flight: any) => ({
          id: flight.id,
          aircraftId: flight.aircraft_id,
          pilotId: flight.pilot_id,
          date: flight.date,
          tachStart: flight.tach_start,
          tachEnd: flight.tach_end,
          hobbsTime: flight.hobbs_time,
          fuelAdded: flight.fuel_added,
          oilAdded: flight.oil_added,
          passengerCount: flight.passenger_count,
          route: flight.route,
          squawks: flight.squawks,
          notes: flight.notes,
          category: flight.category,
          departureTime: flight.departure_time,
          pilotName: flight.pilot_name
        }));
        
        setFlights(flightsData);
      })
      .catch(err => {
        console.error('Error refreshing flights:', err);
        setError('Failed to load flight data. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-destructive/10 p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-medium mb-2">Error loading flights</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold">Flights</h2>
        <div className="relative flex-grow sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search flights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border"
          />
        </div>
      </div>
      
      {filteredFlights.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-xl">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No flight records found</h3>
          <p className="text-muted-foreground">No flights match your current filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Pilot</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>Oil</TableHead>
                <TableHead className="max-w-[200px]">Squawks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlights.map(flight => {
                const hobbsTime = flight.tachEnd - flight.tachStart;
                
                return (
                  <TableRow key={flight.id}>
                    <TableCell>
                      {flight.date ? format(new Date(flight.date), 'MMM d, yyyy') : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {flight.pilotName || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {flight.route || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {flight.category || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hobbsTime.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      {flight.fuelAdded} gal
                    </TableCell>
                    <TableCell>
                      {flight.oilAdded} qt
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate">
                        {flight.squawks || 'None'}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
