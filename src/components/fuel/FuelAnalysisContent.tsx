import { useMemo, useState, useEffect } from 'react';
import { Flight, Aircraft } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Fuel, FlaskConical, Gauge, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getAllFlights } from '@/services/flightService';
import { getAllAircraft } from '@/services/aircraftService';

export function FuelAnalysisContent() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both flights and aircraft data
        const [flightsResponse, aircraftResponse] = await Promise.all([
          getAllFlights(),
          getAllAircraft()
        ]);

        if (flightsResponse.success && flightsResponse.flights) {
          setFlights(flightsResponse.flights);
        } else {
          throw new Error(flightsResponse.error || 'Failed to load flight data');
        }

        if (aircraftResponse.success && aircraftResponse.aircraft) {
          setAircraft(aircraftResponse.aircraft);
        } else {
          throw new Error(aircraftResponse.error || 'Failed to load aircraft data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again later."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Helper function to safely convert string values to numbers
  const toNumber = (value: string | number | undefined | null, defaultValue = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

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
      // Convert string values to numbers safely
      const hobbsTime = toNumber(flight.hobbsTime);
      const tachStart = toNumber(flight.tachStart);
      const tachEnd = toNumber(flight.tachEnd);
      const fuelAdded = toNumber(flight.fuelAdded);
      
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
      // Convert string values to numbers safely
      const hobbsTime = toNumber(flight.hobbsTime);
      const tachStart = toNumber(flight.tachStart);
      const tachEnd = toNumber(flight.tachEnd);
      const fuelAdded = toNumber(flight.fuelAdded);
      
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

  const handleDownloadCSV = () => {
    // Create CSV content
    const headers = ['Aircraft', 'Hours Flown', 'Fuel Added (gal)', 'Fuel Burn (gal/hr)'];
    const rows = fuelAnalysisByAircraft.map(aircraft => [
      aircraft.tailNumber,
      aircraft.totalHours.toFixed(1),
      aircraft.totalFuel.toFixed(1),
      aircraft.fuelPerHour.toFixed(2)
    ]);
    
    // Add overall stats
    rows.push(['ALL AIRCRAFT', overallStats.totalHours.toFixed(1), overallStats.totalFuel.toFixed(1), overallStats.averageGPH.toFixed(2)]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fuel-analysis.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold mb-6">Fuel Analysis</h1>
        <div className="flex justify-center items-center h-64">
          <p>Loading fuel data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold mb-6">Fuel Analysis</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading fuel data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Fuel Analysis</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>
      
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