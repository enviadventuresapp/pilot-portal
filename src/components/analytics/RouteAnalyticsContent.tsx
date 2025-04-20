import React, { useCallback, useMemo } from 'react';
import { Flight, RouteTargetTime, Aircraft, PilotRecord } from '@/types';
import { Download, Printer, RefreshCw, BarChart2, Table as TableIcon, Target, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterOptions } from './FilterOptions';
import { DataTable } from './DataTable';
import { DataChart } from './DataChart';
import { TargetManagement } from './TargetManagement';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { checkIsAdmin } from '@/utils/isAdmin';

export interface RouteAnalyticsContentProps {
  flights?: Flight[];
  targets?: RouteTargetTime[];
  isLoading?: boolean;
  aircraft?: Aircraft[];
  pilots?: PilotRecord[];
}

export const RouteAnalyticsContent: React.FC<RouteAnalyticsContentProps> = ({ 
  flights: propFlights = [], 
  targets: propTargets = [],
  isLoading: propIsLoading = false,
  aircraft: propAircraft = [],
  pilots: propPilots = []
}) => {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [targetTimes, setTargetTimes] = React.useState<RouteTargetTime[]>(propTargets);
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all-months');
  const [selectedYear, setSelectedYear] = React.useState<string>('all-years');
  const [selectedAircraft, setSelectedAircraft] = React.useState<string>('all-aircraft');
  const [selectedPilot, setSelectedPilot] = React.useState<string>('all-pilots');
  const [viewMode, setViewMode] = React.useState<'table' | 'chart'>('table');
  const [sortField, setSortField] = React.useState<string>('route');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = React.useState(propIsLoading);

  // Check admin status
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      const admin = await checkIsAdmin(user?.id);
      setIsAdmin(admin);
    };
    checkAdminStatus();
  }, [user?.id]);

  // Update states when props change
  React.useEffect(() => {
    setTargetTimes(propTargets);
    setIsLoading(propIsLoading);
  }, [propTargets, propIsLoading]);

  // Get unique years from flights
  const uniqueYears = useMemo(() => {
    const years = propFlights
      .map(f => new Date(f.date).getFullYear())
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => b - a);
    return years;
  }, [propFlights]);

  // Calculate route statistics
  const chartData = useMemo(() => {
    const filteredFlights = propFlights.filter(flight => {
      const flightDate = new Date(flight.date);
      const flightMonth = flightDate.getMonth() + 1;
      const flightYear = flightDate.getFullYear();
      
      const monthMatch = selectedMonth === 'all-months' || flightMonth === parseInt(selectedMonth);
      const yearMatch = selectedYear === 'all-years' || flightYear === parseInt(selectedYear);
      const aircraftMatch = selectedAircraft === 'all-aircraft' || flight.aircraftId === selectedAircraft;
      const pilotMatch = selectedPilot === 'all-pilots' || flight.pilotId === selectedPilot;
      
      return monthMatch && yearMatch && aircraftMatch && pilotMatch;
    });
    
    // Group flights by route
    const flightsByRoute = filteredFlights.reduce((acc, flight) => {
      const route = flight.route || 'Unknown';
      if (!acc[route]) acc[route] = [];
      acc[route].push(flight);
      return acc;
    }, {} as Record<string, Flight[]>);
    
    // Calculate stats for each route
    const routeStats = Object.entries(flightsByRoute).map(([route, routeFlights]) => {
      const flightCount = routeFlights.length;
      
      // Calculate total and average time (using hobbsTime or tach difference)
      const totalTime = routeFlights.reduce((sum, flight) => {
        const hobbsTime = typeof flight.hobbsTime === 'number' ? flight.hobbsTime : 0;
        const tachStart = typeof flight.tachStart === 'number' ? flight.tachStart : 0;
        const tachEnd = typeof flight.tachEnd === 'number' ? flight.tachEnd : 0;
        const tachDiff = tachEnd > tachStart ? tachEnd - tachStart : 0;
        return sum + (hobbsTime || tachDiff);
      }, 0);
      
      const averageTime = flightCount > 0 ? totalTime / flightCount : 0;
      
      // Find matching target time
      const targetTime = targetTimes.find(t => 
        t.route === route &&
        (selectedAircraft === 'all-aircraft' || t.aircraftId === selectedAircraft || !t.aircraftId) &&
        (selectedPilot === 'all-pilots' || t.pilotId === selectedPilot || !t.pilotId) &&
        (selectedMonth === 'all-months' || t.month === parseInt(selectedMonth) || !t.month) &&
        (selectedYear === 'all-years' || t.year === parseInt(selectedYear) || !t.year)
      )?.targetTime || null;
      
      // Calculate differences
      const difference = targetTime !== null ? averageTime - targetTime : null;
      const percentDiff = targetTime !== null && targetTime !== 0 
        ? ((averageTime - targetTime) / targetTime) * 100 
        : null;
      
      return {
        route,
        flightCount,
        averageTime: parseFloat(averageTime.toFixed(2)),
        targetTime,
        difference: difference !== null ? parseFloat(difference.toFixed(2)) : null,
        percentDiff: percentDiff !== null ? parseFloat(percentDiff.toFixed(1)) : null
      };
    });
    
    // Sort data
    return routeStats.sort((a, b) => {
      const aValue = a[sortField as keyof typeof a];
      const bValue = b[sortField as keyof typeof b];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [
    propFlights, 
    targetTimes, 
    selectedMonth, 
    selectedYear, 
    selectedAircraft, 
    selectedPilot, 
    sortField, 
    sortDirection
  ]);

  // Toggle sort direction
  const toggleSort = useCallback((field: string) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDirection(dir => dir === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSelectedMonth('all-months');
    setSelectedYear('all-years');
    setSelectedAircraft('all-aircraft');
    setSelectedPilot('all-pilots');
  }, []);

  // Handle target time updates
  const handleUpdateTargetTimes = useCallback((newTargetTimes: RouteTargetTime[]) => {
    setTargetTimes(newTargetTimes);
    toast({
      title: "Target Times Updated",
      description: "Route target times have been successfully updated",
      variant: "default"
    });
  }, [toast]);

  // Export data to CSV
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Route',
      'Flight Count',
      'Average Time (hrs)',
      'Target Time (hrs)',
      'Difference (hrs)',
      'Difference (%)'
    ];
    
    const rows = chartData.map(item => [
      item.route,
      item.flightCount,
      item.averageTime,
      item.targetTime || 'N/A',
      item.difference !== null ? item.difference : 'N/A',
      item.percentDiff !== null ? `${item.percentDiff}%` : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `route-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [chartData]);

  // Print the current view
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6 print:p-4">
      <div className="bg-blue-50 rounded-lg p-6 flex flex-col print:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-blue-600 gap-2">
            <Target className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Route Performance Analysis</h2>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleExportCSV}
              disabled={isLoading}
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-2">
          Compare actual flight times against target times by route. Averages are calculated from flight logbook entries.
        </p>
      </div>
      
      <FilterOptions
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedAircraft={selectedAircraft}
        setSelectedAircraft={setSelectedAircraft}
        selectedPilot={selectedPilot}
        setSelectedPilot={setSelectedPilot}
        resetFilters={resetFilters}
        uniqueYears={uniqueYears}
        aircraft={propAircraft}
        pilots={propPilots}
        isLoading={isLoading}
      />
      
      {isAdmin && (
        <TargetManagement
          selectedAircraft={selectedAircraft}
          selectedPilot={selectedPilot}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          targetTimes={targetTimes}
          setTargetTimes={handleUpdateTargetTimes}
        />
      )}
      
      <div className="flex items-center space-x-4 mb-4 border-b pb-2 print:hidden">
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
          className="flex items-center gap-1"
        >
          <TableIcon className="h-4 w-4" />
          <span>Table View</span>
        </Button>
        <Button
          variant={viewMode === 'chart' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('chart')}
          className="flex items-center gap-1"
        >
          <BarChart2 className="h-4 w-4" />
          <span>Chart View</span>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading route data...</p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <DataTable
          chartData={chartData}
          sortField={sortField}
          sortDirection={sortDirection}
          toggleSort={toggleSort}
          isUserAdmin={isAdmin}
          targetTimes={targetTimes}
          setTargetTimes={handleUpdateTargetTimes}
          selectedAircraft={selectedAircraft}
          selectedPilot={selectedPilot}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      ) : (
        <DataChart chartData={chartData} />
      )}
    </div>
  );
};