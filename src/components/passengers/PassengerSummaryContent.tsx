
import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Flight, Aircraft } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Plane, Route } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

export function PassengerSummaryContent() {
  const [flights] = useLocalStorage<Flight[]>('flights', []);
  const [aircraft] = useLocalStorage<Aircraft[]>('aircraft', []);
  
  // Filter flights by category SF or 135
  const relevantFlights = useMemo(() => {
    return flights.filter(flight => 
      flight.category === 'SF' || flight.category === '135'
    );
  }, [flights]);
  
  const totalPassengers = useMemo(() => {
    return relevantFlights.reduce((sum, flight) => sum + (flight.passengerCount || 0), 0);
  }, [relevantFlights]);
  
  const monthlyPassengers = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 11);
    const months = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: now
    });
    
    const monthlyData = months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthName = format(month, 'MMM yyyy');
      
      const monthFlights = relevantFlights.filter(flight => {
        const flightDate = new Date(flight.date);
        return flightDate >= start && flightDate <= end;
      });
      
      const passengers = monthFlights.reduce((sum, flight) => sum + (flight.passengerCount || 0), 0);
      const flightCount = monthFlights.length;
      
      return {
        name: monthName,
        passengers,
        flights: flightCount,
        average: flightCount ? parseFloat((passengers / flightCount).toFixed(1)) : 0
      };
    });
    
    return monthlyData;
  }, [relevantFlights]);
  
  const passengersByAircraft = useMemo(() => {
    const byAircraft: Record<string, { count: number, flights: number }> = {};
    
    relevantFlights.forEach(flight => {
      if (!byAircraft[flight.aircraftId]) {
        byAircraft[flight.aircraftId] = { count: 0, flights: 0 };
      }
      
      byAircraft[flight.aircraftId].count += (flight.passengerCount || 0);
      byAircraft[flight.aircraftId].flights += 1;
    });
    
    return Object.entries(byAircraft).map(([aircraftId, data]) => {
      const foundAircraft = aircraft.find(a => a.id === aircraftId);
      
      return {
        id: aircraftId,
        name: foundAircraft?.tailNumber || 'Unknown',
        makeModel: `${foundAircraft?.make || 'Unknown'} ${foundAircraft?.model || ''}`,
        passengers: data.count,
        flights: data.flights,
        average: parseFloat((data.count / data.flights).toFixed(1)) || 0
      };
    }).sort((a, b) => b.passengers - a.passengers);
  }, [relevantFlights, aircraft]);
  
  const passengersByRoute = useMemo(() => {
    const byRoute: Record<string, { count: number, flights: number }> = {};
    
    relevantFlights.forEach(flight => {
      const route = flight.route || 'Local';
      
      if (!byRoute[route]) {
        byRoute[route] = { count: 0, flights: 0 };
      }
      
      byRoute[route].count += (flight.passengerCount || 0);
      byRoute[route].flights += 1;
    });
    
    return Object.entries(byRoute)
      .map(([route, data]) => ({
        name: route,
        passengers: data.count,
        flights: data.flights,
        average: parseFloat((data.count / data.flights).toFixed(1)) || 0
      }))
      .sort((a, b) => b.passengers - a.passengers);
  }, [relevantFlights]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const averagePassengersPerFlight = useMemo(() => {
    if (relevantFlights.length === 0) return 0;
    return parseFloat((totalPassengers / relevantFlights.length).toFixed(1));
  }, [totalPassengers, relevantFlights]);
  
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Passenger Summary</h1>
        <div className="text-sm text-muted-foreground">
          Note: Only showing SF and 135 category flights
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Passengers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalPassengers}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Average Per Flight</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{averagePassengersPerFlight}</p>
          </CardContent>
        </Card>
        
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
            <CardTitle className="text-xl">Active Aircraft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{passengersByAircraft.length}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="glass-card rounded-xl p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Monthly Passenger Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyPassengers}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="passengers" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
                name="Total Passengers" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="average" 
                stroke="#82ca9d" 
                name="Avg Passengers per Flight" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <Tabs defaultValue="aircraft" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="aircraft">Passengers by Aircraft</TabsTrigger>
          <TabsTrigger value="routes">Passengers by Route</TabsTrigger>
        </TabsList>
        
        <TabsContent value="aircraft" className="space-y-4">
          <div className="flex gap-4 flex-col xl:flex-row">
            <div className="glass-card rounded-xl p-4 xl:w-1/3">
              <h3 className="text-lg font-medium mb-4">Passengers by Aircraft</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passengersByAircraft.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="passengers"
                    >
                      {passengersByAircraft.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} passengers`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-card rounded-xl overflow-hidden xl:w-2/3">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/70">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Aircraft</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Make/Model</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Passengers</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Flights</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Avg Passengers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {passengersByAircraft.map(item => (
                      <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Plane className="w-4 h-4 text-primary" />
                            <span className="font-medium text-primary">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.makeModel}</td>
                        <td className="px-4 py-3 text-sm">{item.passengers}</td>
                        <td className="px-4 py-3 text-sm">{item.flights}</td>
                        <td className="px-4 py-3 text-sm">{item.average}</td>
                      </tr>
                    ))}
                    {passengersByAircraft.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No passenger data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="routes" className="space-y-4">
          <div className="flex gap-4 flex-col xl:flex-row">
            <div className="glass-card rounded-xl p-4 xl:w-1/2">
              <h3 className="text-lg font-medium mb-4">Top Routes by Passenger Count</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={passengersByRoute.slice(0, 10)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="passengers" fill="#8884d8" name="Total Passengers" />
                    <Bar dataKey="average" fill="#82ca9d" name="Avg Passengers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-card rounded-xl overflow-hidden xl:w-1/2">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/70">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Route</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Passengers</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Flights</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Avg Passengers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {passengersByRoute.map((route, index) => (
                      <tr key={index} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">
                          <div className="flex items-center gap-1.5">
                            <Route className="w-4 h-4 text-primary" />
                            <span>{route.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{route.passengers}</td>
                        <td className="px-4 py-3 text-sm">{route.flights}</td>
                        <td className="px-4 py-3 text-sm">{route.average}</td>
                      </tr>
                    ))}
                    {passengersByRoute.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No route data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
