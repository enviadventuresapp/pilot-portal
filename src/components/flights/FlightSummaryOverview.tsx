import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flight, Aircraft } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plane, Route, Users, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllFlights } from '@/services/flightService';
import { getAllAircraft } from '@/services/aircraftService';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { normalizeAircraft, normalizeAircraftArray } from '@/utils/aircraftUtils';
import { ensureNumber } from '@/utils/numberUtils';

export function FlightSummaryOverview() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeSubscription({
    table: 'flights',
    onInsert: (newFlight) => {
      setFlights(prevFlights => {
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
    },
    onUpdate: (updatedFlight) => {
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
      setFlights(prevFlights =>
        prevFlights.filter(flight => flight.id !== deletedFlight.id)
      );
    }
  });

  useRealtimeSubscription({
    table: 'aircraft',
    onInsert: (newAircraft) => {
      setAircraft(prevAircraft => {
        const exists = prevAircraft.some(a => a.id === newAircraft.id);
        if (exists) return prevAircraft;

        const normalizedAircraft = normalizeAircraft({
          id: newAircraft.id,
          tailNumber: newAircraft.tail_number,
          tail_number: newAircraft.tail_number,
          make: newAircraft.make,
          model: newAircraft.model,
          year: newAircraft.year,
          type: newAircraft.type || newAircraft.make || 'unknown',
          category: newAircraft.category,
          tachTime: newAircraft.tach_time,
          oilChange: newAircraft.oil_change,
          lastAnnual: newAircraft.last_annual,
          ownership: newAircraft.ownership,
          imageUrl: newAircraft.image_url,
          createdAt: newAircraft.created_at,
          updatedAt: newAircraft.updated_at
        });

        return [...prevAircraft, normalizedAircraft];
      });
    },
    onUpdate: (updatedAircraft) => {
      setAircraft(prevAircraft =>
        prevAircraft.map(a => a.id === updatedAircraft.id ?
          normalizeAircraft({
            id: updatedAircraft.id,
            tailNumber: updatedAircraft.tail_number,
            tail_number: updatedAircraft.tail_number,
            make: updatedAircraft.make,
            model: updatedAircraft.model,
            year: updatedAircraft.year,
            type: updatedAircraft.type || updatedAircraft.make || 'unknown',
            category: updatedAircraft.category,
            tachTime: updatedAircraft.tach_time,
            oilChange: updatedAircraft.oil_change,
            lastAnnual: updatedAircraft.last_annual,
            ownership: updatedAircraft.ownership,
            imageUrl: updatedAircraft.image_url,
            createdAt: updatedAircraft.created_at,
            updatedAt: updatedAircraft.updated_at
          }) : a)
      );
    },
    onDelete: (deletedAircraft) => {
      setAircraft(prevAircraft =>
        prevAircraft.filter(a => a.id !== deletedAircraft.id)
      );
    }
  });

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const { success: flightsSuccess, flights: fetchedFlights, error: flightsError } = await getAllFlights();
      if (flightsSuccess && fetchedFlights) {
        setFlights(fetchedFlights);
      } else if (flightsError) {
        toast.error('Failed to load flight data');
      }

      const { success: aircraftSuccess, aircraft: fetchedAircraft, error: aircraftError } = await getAllAircraft();
      if (aircraftSuccess && fetchedAircraft) {
        setAircraft(normalizeAircraftArray(fetchedAircraft));
      } else if (aircraftError) {
        toast.error('Failed to load aircraft data');
      }
    } catch (error) {
      toast.error('Error loading flight summary data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter flights by SF or 135 category
  const filteredFlights = useMemo(() => {
    return flights.filter(flight =>
      flight.category === 'SF' || flight.category === '135'
    );
  }, [flights]);

  const flightsByAircraft = useMemo(() => {
    const byAircraft: Record<string, Flight[]> = {};

    filteredFlights.forEach(flight => {
      if (!flight.aircraftId) return;

      if (!byAircraft[flight.aircraftId]) {
        byAircraft[flight.aircraftId] = [];
      }
      byAircraft[flight.aircraftId].push(flight);
    });

    return byAircraft;
  }, [filteredFlights]);

  const aircraftStats = useMemo(() => {
    return Object.entries(flightsByAircraft).map(([aircraftId, aircraftFlights]) => {
      const foundAircraft = aircraft.find(a => a.id === aircraftId);

      let totalHours = 0;
      let totalTach = 0;

      aircraftFlights.forEach(flight => {
        const hobbsTime = ensureNumber(flight.hobbsTime);
        const tachStart = ensureNumber(flight.tachStart);
        const tachEnd = ensureNumber(flight.tachEnd);
        const tachDiff = tachEnd > tachStart ? tachEnd - tachStart : 0;

        totalHours += hobbsTime || tachDiff;
        totalTach += tachDiff;
      });

      const flightCount = aircraftFlights.length;
      const averageFlightTime = flightCount > 0 ? totalHours / flightCount : 0;
      const averageTachTime = flightCount > 0 ? totalTach / flightCount : 0;

      return {
        id: aircraftId,
        tailNumber: foundAircraft?.tailNumber || 'Unknown',
        make: foundAircraft?.make || 'Unknown',
        model: foundAircraft?.model || 'Unknown',
        flightCount,
        totalHours: parseFloat(totalHours.toFixed(1)),
        totalTach: parseFloat(totalTach.toFixed(1)),
        averageFlightTime: parseFloat(averageFlightTime.toFixed(1)),
        averageTachTime: parseFloat(averageTachTime.toFixed(1))
      };
    });
  }, [flightsByAircraft, aircraft]);

  const pilotStats = useMemo(() => {
    const byPilot: Record<string, { count: number, hours: number }> = {};

    filteredFlights.forEach(flight => {
      const pilot = flight.pilotName || 'Unknown';
      const hobbsTime = ensureNumber(flight.hobbsTime);
      const tachStart = ensureNumber(flight.tachStart);
      const tachEnd = ensureNumber(flight.tachEnd);
      const tachDiff = tachEnd > tachStart ? tachEnd - tachStart : 0;
      const hours = hobbsTime || tachDiff;

      if (!byPilot[pilot]) {
        byPilot[pilot] = { count: 0, hours: 0 };
      }

      byPilot[pilot].count += 1;
      byPilot[pilot].hours += hours;
    });

    return Object.entries(byPilot).map(([pilot, stats]) => {
      const averageTime = stats.count > 0 ? stats.hours / stats.count : 0;
      return {
        name: pilot,
        flights: stats.count,
        hours: parseFloat(stats.hours.toFixed(1)),
        averageTime: parseFloat(averageTime.toFixed(1))
      };
    }).sort((a, b) => b.flights - a.flights);
  }, [filteredFlights]);

  const routeStats = useMemo(() => {
    const byRoute: Record<string, { count: number, hours: number, tach: number }> = {};

    filteredFlights.forEach(flight => {
      const route = flight.route || 'Local';
      const hobbsTime = ensureNumber(flight.hobbsTime);
      const tachStart = ensureNumber(flight.tachStart);
      const tachEnd = ensureNumber(flight.tachEnd);
      const tachDiff = tachEnd > tachStart ? tachEnd - tachStart : 0;
      const hours = hobbsTime || tachDiff;

      if (!byRoute[route]) {
        byRoute[route] = { count: 0, hours: 0, tach: 0 };
      }

      const current = byRoute[route]!;
      byRoute[route] = {
        count: current.count + 1,
        hours: current.hours + hours,
        tach: current.tach + tachDiff
      };
    });

    return Object.entries(byRoute).map(([route, stats]) => {
      const averageTime = stats.count > 0 ? stats.hours / stats.count : 0;
      const averageTach = stats.count > 0 ? stats.tach / stats.count : 0;

      return {
        name: route,
        flights: stats.count,
        hours: parseFloat(stats.hours.toFixed(1)),
        tach: parseFloat(stats.tach.toFixed(1)),
        averageTime: parseFloat(averageTime.toFixed(1)),
        averageTach: parseFloat(averageTach.toFixed(1))
      };
    }).sort((a, b) => b.flights - a.flights);
  }, [filteredFlights]);

  const handleDownloadCSV = () => {
    // Create CSV content for aircraft stats
    const aircraftHeaders = ['Aircraft', 'Make/Model', 'Flights', 'Total Hours', 'Total Tach', 'Avg Hobbs', 'Avg Tach'];
    const aircraftRows = aircraftStats.map(stat => [
      stat.tailNumber,
      `${stat.make} ${stat.model}`,
      stat.flightCount,
      stat.totalHours,
      stat.totalTach,
      stat.averageFlightTime,
      stat.averageTachTime
    ]);

    // Create CSV content for pilot stats
    const pilotHeaders = ['Pilot', 'Flights', 'Total Hours', 'Average Time'];
    const pilotRows = pilotStats.map(stat => [
      stat.name,
      stat.flights,
      stat.hours,
      stat.averageTime
    ]);

    // Create CSV content for route stats
    const routeHeaders = ['Route', 'Flights', 'Total Hours', 'Total Tach', 'Avg Hobbs', 'Avg Tach'];
    const routeRows = routeStats.map(stat => [
      stat.name,
      stat.flights,
      stat.hours,
      stat.tach,
      stat.averageTime,
      stat.averageTach
    ]);

    // Combine all sections
    const csvContent = [
      'AIRCRAFT SUMMARY',
      aircraftHeaders.join(','),
      ...aircraftRows.map(row => row.join(',')),
      '\nPILOT SUMMARY',
      pilotHeaders.join(','),
      ...pilotRows.map(row => row.join(',')),
      '\nROUTE SUMMARY',
      routeHeaders.join(','),
      ...routeRows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'flight-summary.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

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
        <h1 className="text-2xl font-semibold">Flight Summary (SF/135 Only)</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {filteredFlights.length} flights
          </span>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Flights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{filteredFlights.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Flight Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {filteredFlights.reduce((sum, flight) => {
                const hobbsTime = ensureNumber(flight.hobbsTime);
                const tachStart = ensureNumber(flight.tachStart);
                const tachEnd = ensureNumber(flight.tachEnd);
                const tachDiff = tachEnd > tachStart ? tachEnd - tachStart : 0;
                return sum + (hobbsTime || tachDiff);
              }, 0).toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Active Aircraft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{Object.keys(flightsByAircraft).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Aircraft Summary</h2>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/70">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Aircraft</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Make/Model</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Flights</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Total Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Total Tach</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Avg Hobbs</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Avg Tach</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {aircraftStats.map(stat => (
                  <tr key={stat.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">{stat.tailNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{stat.make} {stat.model}</td>
                    <td className="px-4 py-3 text-sm">{stat.flightCount}</td>
                    <td className="px-4 py-3 text-sm">{stat.totalHours} hrs</td>
                    <td className="px-4 py-3 text-sm">{stat.totalTach} hrs</td>
                    <td className="px-4 py-3 text-sm">{stat.averageFlightTime} hrs</td>
                    <td className="px-4 py-3 text-sm">{stat.averageTachTime} hrs</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Link
                        to={`/flight-summary/${stat.id}`}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {aircraftStats.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No flight data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pilots" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pilots">Pilot Statistics</TabsTrigger>
          <TabsTrigger value="routes">Route Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="pilots" className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-lg font-medium mb-4">Flights by Pilot</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pilotStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="flights" fill="#8884d8" name="Flights" />
                  <Bar dataKey="hours" fill="#82ca9d" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Pilot</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Flights</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total Hours</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Average Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pilotStats.map(stat => (
                    <tr key={stat.name} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{stat.name}</td>
                      <td className="px-4 py-3 text-sm">{stat.flights}</td>
                      <td className="px-4 py-3 text-sm">{stat.hours} hrs</td>
                      <td className="px-4 py-3 text-sm">{stat.averageTime} hrs</td>
                    </tr>
                  ))}
                  {pilotStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No pilot data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-lg font-medium mb-4">Flights by Route</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={routeStats.slice(0, 10)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="flights" fill="#8884d8" name="Flights" />
                  <Bar dataKey="averageTach" fill="#82ca9d" name="Avg Tach Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                  {routeStats.map(stat => (
                    <tr key={stat.name} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{stat.name}</td>
                      <td className="px-4 py-3 text-sm">{stat.flights}</td>
                      <td className="px-4 py-3 text-sm">{stat.hours} hrs</td>
                      <td className="px-4 py-3 text-sm">{stat.tach} hrs</td>
                      <td className="px-4 py-3 text-sm">{stat.averageTime} hrs</td>
                      <td className="px-4 py-3 text-sm">{stat.averageTach} hrs</td>
                    </tr>
                  ))}
                  {routeStats.length === 0 && (
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
      </Tabs>
    </div>
  );
}