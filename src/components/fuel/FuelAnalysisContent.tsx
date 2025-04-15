
import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Flight, Aircraft } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Fuel, FlaskConical, Gauge } from 'lucide-react';

export function FuelAnalysisContent() {
  const [flights] = useLocalStorage<Flight[]>('flights', []);
  const [aircraft] = useLocalStorage<Aircraft[]>('aircraft', []);
  
  const fuelAnalysisByAircraft = useMemo(() => {
    const byAircraft: Record<string, { 
      aircraftId: string,
      tailNumber: string,
      totalHours: number,
      totalFuel: number,
      fuelPerHour: number
    }> = {};
    
    // Group flights by aircraft
    flights.forEach(flight => {
      // Ensure we get numeric values
      const hobbsTime = typeof flight.hobbsTime === 'number' ? flight.hobbsTime : 0;
      const tachStart = typeof flight.tachStart === 'number' ? flight.tachStart : 0;
      const tachEnd = typeof flight.tachEnd === 'number' ? flight.tachEnd : 0;
      const fuelAdded = typeof flight.fuelAdded === 'number' ? flight.fuelAdded : 0;
      
      const hoursFlown = hobbsTime || (tachEnd - tachStart);
      
      if (!byAircraft[flight.aircraftId]) {
        const foundAircraft = aircraft.find(a => a.id === flight.aircraftId);
        byAircraft[flight.aircraftId] = {
          aircraftId: flight.aircraftId,
          tailNumber: foundAircraft?.tailNumber || 'Unknown',
          totalHours: 0,
          totalFuel: 0,
          fuelPerHour: 0
        };
      }
      
      byAircraft[flight.aircraftId].totalHours += hoursFlown;
      byAircraft[flight.aircraftId].totalFuel += fuelAdded;
    });
    
    // Calculate fuel per hour for each aircraft
    Object.values(byAircraft).forEach(stats => {
      stats.fuelPerHour = stats.totalHours > 0 
        ? parseFloat((stats.totalFuel / stats.totalHours).toFixed(2)) 
        : 0;
    });
    
    return Object.values(byAircraft)
      .filter(stats => stats.totalHours > 0 && stats.totalFuel > 0)
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [flights, aircraft]);
  
  // Calculate overall totals and averages
  const overallStats = useMemo(() => {
    let totalHours = 0;
    let totalFuel = 0;
    
    flights.forEach(flight => {
      // Ensure we're dealing with numbers
      const hobbsTime = typeof flight.hobbsTime === 'number' ? flight.hobbsTime : 0;
      const tachStart = typeof flight.tachStart === 'number' ? flight.tachStart : 0;
      const tachEnd = typeof flight.tachEnd === 'number' ? flight.tachEnd : 0;
      const fuelAdded = typeof flight.fuelAdded === 'number' ? flight.fuelAdded : 0;
      
      totalHours += hobbsTime || (tachEnd - tachStart);
      totalFuel += fuelAdded;
    });
    
    const averageGPH = totalHours > 0 
      ? parseFloat((totalFuel / totalHours).toFixed(2)) 
      : 0;
    
    return { totalHours, totalFuel, averageGPH };
  }, [flights]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return fuelAnalysisByAircraft.map(aircraft => ({
      name: aircraft.tailNumber,
      'Fuel Burn (GPH)': aircraft.fuelPerHour,
      'Hours Flown': aircraft.totalHours,
      'Total Fuel (gal)': aircraft.totalFuel
    }));
  }, [fuelAnalysisByAircraft]);
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6">Fuel Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-500" />
              Total Hours Flown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{overallStats.totalHours.toFixed(1)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Fuel className="h-5 w-5 text-green-500" />
              Total Fuel Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{overallStats.totalFuel.toFixed(1)} gal</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-amber-500" />
              Average Fuel Burn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{overallStats.averageGPH.toFixed(2)} gal/hr</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="glass-card rounded-xl p-4 mb-8">
        <h2 className="text-xl font-medium mb-4">Fuel Burn by Aircraft</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Fuel Burn (GPH)" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/70">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Aircraft</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Hours Flown</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Fuel Added (gal)</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Fuel Burn (gal/hr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fuelAnalysisByAircraft.map(aircraft => (
                <tr key={aircraft.aircraftId} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{aircraft.tailNumber}</td>
                  <td className="px-4 py-3 text-sm">{aircraft.totalHours.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm">{aircraft.totalFuel.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm">{aircraft.fuelPerHour.toFixed(2)}</td>
                </tr>
              ))}
              {fuelAnalysisByAircraft.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No fuel data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
