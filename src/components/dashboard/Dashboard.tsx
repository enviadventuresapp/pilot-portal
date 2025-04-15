
import { useState, useEffect } from 'react';
import { Clock, Fuel, Droplets, AlertTriangle, RefreshCw } from 'lucide-react';
import { Flight, SafetyReport, DashboardStats, Aircraft } from '@/types';
import { getAllFlights } from '@/services/flightService';
import { getAllSafetyReports } from '@/services/safetyService';
import { getAllAircraft } from '@/services/aircraftService';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export function Dashboard() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalFlights: 0,
    totalHours: 0,
    totalFuel: 0,
    totalOil: 0,
    activeAircraft: 0,
    recentSquawks: [],
    safetyReports: {
      total: 0,
      open: 0,
      critical: 0,
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Set up realtime subscriptions for flights and safety reports
  useRealtimeSubscription({
    table: 'flights',
    onInsert: (newFlight) => {
      console.log('New flight added:', newFlight);
      setFlights(prevFlights => [...prevFlights, newFlight]);
    },
    onUpdate: (updatedFlight) => {
      console.log('Flight updated:', updatedFlight);
      setFlights(prevFlights => 
        prevFlights.map(flight => flight.id === updatedFlight.id ? updatedFlight : flight)
      );
    }
  });

  useRealtimeSubscription({
    table: 'safety_reports',
    onInsert: (newReport) => {
      console.log('New safety report added:', newReport);
      setSafetyReports(prevReports => [...prevReports, newReport]);
    },
    onUpdate: (updatedReport) => {
      console.log('Safety report updated:', updatedReport);
      setSafetyReports(prevReports => 
        prevReports.map(report => report.id === updatedReport.id ? updatedReport : report)
      );
    }
  });

  // Effect to recalculate stats whenever data changes
  useEffect(() => {
    if (flights.length > 0 || safetyReports.length > 0 || aircraft.length > 0) {
      calculateStats();
    }
  }, [flights, safetyReports, aircraft]);

  const fetchAllData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch flights
      const { success: flightsSuccess, flights: fetchedFlights, error: flightsError } = await getAllFlights();
      if (flightsSuccess && fetchedFlights) {
        console.log('Fetched flights for dashboard:', fetchedFlights.length);
        setFlights(fetchedFlights);
      } else if (flightsError) {
        console.error('Error fetching flights:', flightsError);
      }
      
      // Fetch safety reports
      const { success: reportsSuccess, reports: fetchedReports, error: reportsError } = await getAllSafetyReports();
      if (reportsSuccess && fetchedReports) {
        console.log('Fetched safety reports for dashboard:', fetchedReports.length);
        setSafetyReports(fetchedReports);
      } else if (reportsError) {
        console.error('Error fetching safety reports:', reportsError);
      }
      
      // Fetch aircraft
      const { success: aircraftSuccess, aircraft: fetchedAircraft, error: aircraftError } = await getAllAircraft();
      if (aircraftSuccess && fetchedAircraft) {
        console.log('Fetched aircraft for dashboard:', fetchedAircraft.length);
        setAircraft(fetchedAircraft);
      } else if (aircraftError) {
        console.error('Error fetching aircraft:', aircraftError);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    // Calculate stats from flights and safety reports
    const totalFlights = flights.length;
    const activeAircraft = aircraft.length;
    
    let totalHours = 0;
    let totalFuel = 0;
    let totalOil = 0;
    const rawSquawks: Array<{flightId: string, aircraftId: string, squawk: string, date: string}> = [];
    
    flights.forEach(flight => {
      // Calculate hobbs time (tach end - tach start)
      // Ensure we're dealing with numbers by parsing or using defaults
      const hobbsTime = typeof flight.hobbsTime === 'number' ? flight.hobbsTime : 0; 
      const tachStart = typeof flight.tachStart === 'number' ? flight.tachStart : 0;
      const tachEnd = typeof flight.tachEnd === 'number' ? flight.tachEnd : 0;
      const flightHours = hobbsTime || (tachEnd - tachStart);
      
      totalHours += flightHours;
      
      // Ensure fuel and oil are numbers
      const fuelAdded = typeof flight.fuelAdded === 'number' ? flight.fuelAdded : 0;
      const oilAdded = typeof flight.oilAdded === 'number' ? flight.oilAdded : 0;
      
      totalFuel += fuelAdded;
      totalOil += oilAdded;
      
      // Add non-empty squawks to recent squawks
      if (flight.squawks?.trim()) {
        rawSquawks.push({
          flightId: flight.id,
          aircraftId: flight.aircraftId,
          squawk: flight.squawks,
          date: flight.date
        });
      }
    });
    
    // Only keep the 5 most recent squawks, formatted according to DashboardStats type
    const sortedSquawks = rawSquawks
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(item => {
        const aircraftTail = aircraft.find(a => a.id === item.aircraftId)?.tailNumber || item.aircraftId;
        return {
          id: item.flightId,
          aircraft: aircraftTail,
          date: item.date,
          description: item.squawk
        };
      });
    
    // Calculate safety report stats
    const safetyStats = {
      total: safetyReports.length,
      open: safetyReports.filter(r => r.status !== 'closed' && r.status !== 'resolved').length,
      critical: safetyReports.filter(r => r.severity === 'critical').length
    };
    
    setStats({
      totalFlights,
      totalHours,
      totalFuel,
      totalOil,
      activeAircraft,
      recentSquawks: sortedSquawks,
      safetyReports: safetyStats
    });
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Flight Operations Dashboard</h1>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-cloud-200/50 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Flights" 
            value={stats.totalFlights.toString()} 
            icon={<Plane className="w-5 h-5 text-blue-500" />} 
            color="blue"
          />
          <StatCard 
            title="Flight Hours" 
            value={stats.totalHours.toFixed(1)} 
            icon={<Clock className="w-5 h-5 text-green-500" />} 
            color="green"
          />
          <StatCard 
            title="Fuel Added" 
            value={`${stats.totalFuel.toFixed(1)} gal`} 
            icon={<Fuel className="w-5 h-5 text-amber-500" />} 
            color="amber"
          />
          <StatCard 
            title="Oil Added" 
            value={`${stats.totalOil.toFixed(1)} qt`} 
            icon={<Droplets className="w-5 h-5 text-red-500" />} 
            color="red"
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-medium mb-4">Recent Aircraft Squawks</h2>
            {stats.recentSquawks && stats.recentSquawks.length > 0 ? (
              <div className="space-y-4">
                {stats.recentSquawks.map((squawk, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{squawk.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aircraft: {squawk.aircraft} • {new Date(squawk.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No squawks reported</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-medium mb-4">Safety Reports Status</h2>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-cloud-200/50 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm">Total Reports</span>
                  <span className="font-medium">{stats.safetyReports.total}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-amber-50/50 rounded-lg">
                  <span className="text-sm">Open Items</span>
                  <span className="font-medium text-amber-600">{stats.safetyReports.open}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50/50 rounded-lg">
                  <span className="text-sm">Critical Issues</span>
                  <span className="font-medium text-red-600">{stats.safetyReports.critical}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'red';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorMap = {
    'blue': 'bg-blue-50/50 border-blue-100',
    'green': 'bg-green-50/50 border-green-100',
    'amber': 'bg-amber-50/50 border-amber-100',
    'red': 'bg-red-50/50 border-red-100'
  };
  
  return (
    <div className={`glass-card rounded-xl p-5 card-hover ${colorMap[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-full bg-white shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Plane({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  );
}
