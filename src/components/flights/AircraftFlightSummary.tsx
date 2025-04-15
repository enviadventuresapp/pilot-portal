
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flight, Aircraft } from '@/types';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plane, Route, Users, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFlightsByAircraft } from '@/services/flightService';
import { getAllAircraft } from '@/services/aircraftService';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface AircraftFlightSummaryProps {
  aircraftId: string;
}

export function AircraftFlightSummary({ aircraftId }: AircraftFlightSummaryProps) {
  const navigate = useNavigate();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [routeFilter, setRouteFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  console.log("this is flight summary", flights);
  console.log("this is air summary", aircraft);
  // Set up realtime subscriptions for this aircraft's flights
  useRealtimeSubscription({
    table: 'flights',
    onInsert: (newFlight) => {
      if (newFlight.aircraft_id === aircraftId) {
        console.log('New flight added for aircraft:', newFlight);
        setFlights(prevFlights => {
          // Check if flight with this ID already exists (avoid duplicates)
          const exists = prevFlights.some(flight => flight.id === newFlight.id);
          if (exists) return prevFlights;
          
          const convertedFlight: Flight = {
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
            pilotName: newFlight.pilot_name || ''
          };
          
          return [...prevFlights, convertedFlight];
        });
        toast.success('New flight added');
      }
    },
    onUpdate: (updatedFlight) => {
      if (updatedFlight.aircraft_id === aircraftId) {
        console.log('Flight updated for aircraft:', updatedFlight);
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
            pilotName: updatedFlight.pilot_name || flight.pilotName || ''
          } : flight)
        );
      }
    },
    onDelete: (deletedFlight) => {
      console.log('Flight deleted:', deletedFlight);
      setFlights(prevFlights => 
        prevFlights.filter(flight => flight.id !== deletedFlight.id)
      );
      toast.info('Flight removed');
    },
    filter: { aircraft_id: aircraftId } // Only listen for events related to this aircraft
  });
  
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch aircraft
      const { success: aircraftSuccess, aircraft: fetchedAircraft, error: aircraftError } = await getAllAircraft();
      if (aircraftSuccess && fetchedAircraft) {
        console.log('Fetched aircraft for summary details:', fetchedAircraft.length);
        setAircraft(fetchedAircraft);
      } else if (aircraftError) {
        console.error('Error fetching aircraft for summary details:', aircraftError);
        toast.error('Failed to load aircraft data');
      }
      
      // Fetch flights for this specific aircraft
      const { success: flightsSuccess, flights: fetchedFlights, error: flightsError } = await getFlightsByAircraft(aircraftId);
      if (flightsSuccess && fetchedFlights) {
        console.log('Fetched flights for aircraft ID:', aircraftId, fetchedFlights.length);
        setFlights(fetchedFlights);
      } else if (flightsError) {
        console.error('Error fetching flights for aircraft:', flightsError);
        toast.error('Failed to load flight data for this aircraft');
      }
    } catch (error) {
      console.error('Error fetching data for aircraft flight summary:', error);
      toast.error('Error loading flight summary data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const currentAircraft = useMemo(() => {
    return aircraft.find(a => a.id === aircraftId);
  }, [aircraft, aircraftId]);
  
  const filteredFlights = useMemo(() => {
    if (!routeFilter) return flights;
    return flights.filter(flight => flight.route?.includes(routeFilter));
  }, [flights, routeFilter]);
  
  const routes = useMemo(() => {
    const routeMap = new Map<string, { count: number, hours: number, tach: number }>();
    
    flights.forEach(flight => {
      const route = flight.route || 'Local';
      
      // Skip RUNUP entries
      if (route.toUpperCase() === 'RUNUP') return;
      
      const hours = flight.hobbsTime || (flight.tachEnd - flight.tachStart);
      const tach = (flight.tachEnd || 0) - (flight.tachStart || 0);
      
      if (!routeMap.has(route)) {
        routeMap.set(route, { count: 0, hours: 0, tach: 0 });
      }
      
      const current = routeMap.get(route)!;
      routeMap.set(route, {
        count: current.count + 1,
        hours: current.hours + hours,
        tach: current.tach + tach
      });
    });
    
    return Array.from(routeMap.entries()).map(([route, stats]) => ({
      name: route,
      flights: stats.count,
      hours: parseFloat(stats.hours.toFixed(1)),
      tach: parseFloat(stats.tach.toFixed(1)),
      averageTime: parseFloat((stats.hours / stats.count).toFixed(1)) || 0,
      averageTach: parseFloat((stats.tach / stats.count).toFixed(1)) || 0
    })).sort((a, b) => b.flights - a.flights);
  }, [flights]);
  
  const pilots = useMemo(() => {
    const pilotMap = new Map<string, { count: number, hours: number, tach: number }>();
    
    flights.forEach(flight => {
      const pilot = flight.pilotName || 'Unknown';
      
      // Skip Unknown pilots
      if (pilot === 'Unknown') return;
      
      const hours = flight.hobbsTime || (flight.tachEnd - flight.tachStart);
      const tach = (flight.tachEnd || 0) - (flight.tachStart || 0);
      
      if (!pilotMap.has(pilot)) {
        pilotMap.set(pilot, { count: 0, hours: 0, tach: 0 });
      }
      
      const current = pilotMap.get(pilot)!;
      pilotMap.set(pilot, {
        count: current.count + 1,
        hours: current.hours + hours,
        tach: current.tach + tach
      });
    });
    
    return Array.from(pilotMap.entries()).map(([pilot, stats]) => ({
      name: pilot,
      flights: stats.count,
      hours: parseFloat(stats.hours.toFixed(1)),
      tach: parseFloat(stats.tach.toFixed(1)),
      averageTime: parseFloat((stats.hours / stats.count).toFixed(1)) || 0,
      averageTach: parseFloat((stats.tach / stats.count).toFixed(1)) || 0
    })).sort((a, b) => b.flights - a.flights);
  }, [flights]);
  
  const totalHours = useMemo(() => {
    return flights.reduce((sum, flight) => 
      sum + (flight.hobbsTime || (flight.tachEnd - flight.tachStart)), 0);
  }, [flights]);
  
  const totalTach = useMemo(() => {
    return flights.reduce((sum, flight) => 
      sum + ((flight.tachEnd || 0) - (flight.tachStart || 0)), 0);
  }, [flights]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/flight-summary" className="text-primary hover:text-primary/80">
              ← Back to Summary
            </Link>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            {currentAircraft?.tailNumber || 'Aircraft'} Summary
          </h1>
          <p className="text-muted-foreground">
            {currentAircraft?.make} {currentAircraft?.model} ({currentAircraft?.year})
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/flights')} 
          variant="outline"
        >
          View Flight Logbook
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Flights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{flights.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Flight Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalHours.toFixed(1)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Tach Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalTach.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4 flex-col xl:flex-row mb-8">
        <div className="glass-card rounded-xl p-4 flex-1">
          <h3 className="text-lg font-medium mb-4">Flight Hours by Pilot</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pilots}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {pilots.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} hours`, 'Flight Time']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-4 flex-1">
          <h3 className="text-lg font-medium mb-4">Top Routes</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={routes.slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="flights" fill="#8884d8" name="Flights" />
                <Bar dataKey="averageTime" fill="#82ca9d" name="Avg Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="routes">Route Analysis</TabsTrigger>
          <TabsTrigger value="pilots">Pilot Analysis</TabsTrigger>
          <TabsTrigger value="flights">Flight List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="routes" className="space-y-4">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Flights</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total Hours</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total Tach</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Avg Hobbs</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Avg Tach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {routes.map(route => (
                    <tr key={route.name} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{route.name}</td>
                      <td className="px-4 py-3 text-sm">{route.flights}</td>
                      <td className="px-4 py-3 text-sm">{route.hours} hrs</td>
                      <td className="px-4 py-3 text-sm">{route.tach} hrs</td>
                      <td className="px-4 py-3 text-sm">{route.averageTime} hrs</td>
                      <td className="px-4 py-3 text-sm">{route.averageTach} hrs</td>
                    </tr>
                  ))}
                  {routes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No route data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="pilots" className="space-y-4">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Pilot</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Flights</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total Hours</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total Tach</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Avg Hobbs</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Avg Tach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pilots.map(pilot => (
                    <tr key={pilot.name} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{pilot.name}</td>
                      <td className="px-4 py-3 text-sm">{pilot.flights}</td>
                      <td className="px-4 py-3 text-sm">{pilot.hours} hrs</td>
                      <td className="px-4 py-3 text-sm">{pilot.tach} hrs</td>
                      <td className="px-4 py-3 text-sm">{pilot.averageTime} hrs</td>
                      <td className="px-4 py-3 text-sm">{pilot.averageTach} hrs</td>
                    </tr>
                  ))}
                  {pilots.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No pilot data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="flights" className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Filter by route..."
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2"
              />
              <Route className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            
            {routeFilter && (
              <button
                onClick={() => setRouteFilter('')}
                className="text-sm text-primary hover:text-primary/80"
              >
                Clear Filter
              </button>
            )}
          </div>
          
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Pilot</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tach Start</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tach End</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tach Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Hobbs</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFlights.map(flight => {
                    const hours = flight.hobbsTime || (flight.tachEnd - flight.tachStart);
                    const tachTotal = (flight.tachEnd || 0) - (flight.tachStart || 0);
                    const formattedDate = format(new Date(flight.date), 'MMM d, yyyy');
                    
                    return (
                      <tr key={flight.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-sm">{formattedDate}</td>
                        <td className="px-4 py-3 text-sm font-medium">{flight.pilotName || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm">{flight.route || 'Local'}</td>
                        <td className="px-4 py-3 text-sm">{flight.tachStart?.toFixed(1) || '-'}</td>
                        <td className="px-4 py-3 text-sm">{flight.tachEnd?.toFixed(1) || '-'}</td>
                        <td className="px-4 py-3 text-sm">{tachTotal.toFixed(1)} hrs</td>
                        <td className="px-4 py-3 text-sm">{hours.toFixed(1)} hrs</td>
                        <td className="px-4 py-3 text-sm">
                          <Link 
                            to={`/flights/${flight.id}`}
                            className="text-primary hover:text-primary/80"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFlights.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        {routeFilter ? 'No flights match the route filter' : 'No flight data available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
