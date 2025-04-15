import React, { useState, useEffect, useCallback } from 'react';
import { Flight, RouteTargetTime, Aircraft, PilotRecord } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, BarChart2, Table as TableIcon, Target, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterOptions } from './FilterOptions';
import { DataTable } from './DataTable';
import { DataChart } from './DataChart';
import { TargetManagement } from './TargetManagement';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { getAllAircraft } from '@/services/aircraftService';
import { getAllPilots } from '@/services/pilotService';
import { toast as sonnerToast } from 'sonner';
import { checkIsAdmin } from '@/utils/isAdmin';

export interface RouteAnalyticsContentProps {
  flights?: Flight[];
  targets?: RouteTargetTime[];
  isLoading?: boolean;
}

export const RouteAnalyticsContent: React.FC<RouteAnalyticsContentProps> = ({ 
  flights: propFlights, 
  targets: propTargets,
  isLoading: propIsLoading = false
}) => {
  const [targetTimes, setTargetTimes] = useState<RouteTargetTime[]>(propTargets || []);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [pilots, setPilots] = useState<PilotRecord[]>([]);
  const [isAircraftPilotLoading, setIsAircraftPilotLoading] = useState<boolean>(false);
  const [aircraftPilotError, setAircraftPilotError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const flights = propFlights || [];
  
  const [selectedMonth, setSelectedMonth] = useState<string>('all-months');
  const [selectedYear, setSelectedYear] = useState<string>('all-years');
  const [selectedAircraft, setSelectedAircraft] = useState<string>('all-aircraft');
  const [selectedPilot, setSelectedPilot] = useState<string>('all-pilots');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [sortField, setSortField] = useState<string>('route');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState<boolean>(propIsLoading);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  // Update loading state when prop changes
  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await checkIsAdmin();
      setIsAdmin(isAdmin);
    };
    checkAdmin();
    setIsLoading(propIsLoading);
  }, [propIsLoading]);
  
  // Update targetTimes state when prop changes
  useEffect(() => {
    if (propTargets) {
      setTargetTimes(propTargets);
    }
  }, [propTargets]);
  
  const uniqueYears = React.useMemo(() => {
    const years = flights
      .map(f => new Date(f.date).getFullYear())
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => b - a);
    return years;
  }, [flights]);
  
  const chartData = React.useMemo(() => {
    const filteredFlights = flights.filter(flight => {
      const flightDate = new Date(flight.date);
      const flightMonth = flightDate.getMonth() + 1;
      const flightYear = flightDate.getFullYear();
      
      const monthMatch = selectedMonth === 'all-months' || flightMonth === parseInt(selectedMonth);
      const yearMatch = selectedYear === 'all-years' || flightYear === parseInt(selectedYear);
      const aircraftMatch = selectedAircraft === 'all-aircraft' || flight.aircraftId === selectedAircraft;
      const pilotMatch = selectedPilot === 'all-pilots' || flight.pilotId === selectedPilot;
      
      return monthMatch && yearMatch && aircraftMatch && pilotMatch;
    });
    
    const flightsByRoute = filteredFlights.reduce((acc, flight) => {
      const route = flight.route || 'Unknown';
      if (!acc[route]) {
        acc[route] = [];
      }
      acc[route].push(flight);
      return acc;
    }, {} as Record<string, Flight[]>);
    
    const routeStats = Object.entries(flightsByRoute).map(([route, routeFlights]) => {
      const flightCount = routeFlights.length;
      const totalTime = routeFlights.reduce((sum, f) => sum + f.hobbsTime, 0);
      const averageTime = flightCount > 0 ? totalTime / flightCount : 0;
      
      const targetTime = targetTimes.find(t => 
        t.route === route &&
        (selectedAircraft === 'all-aircraft' || t.aircraftId === selectedAircraft || !t.aircraftId) &&
        (selectedPilot === 'all-pilots' || t.pilotId === selectedPilot || !t.pilotId) &&
        (selectedMonth === 'all-months' || t.month === parseInt(selectedMonth) || !t.month) &&
        (selectedYear === 'all-years' || t.year === parseInt(selectedYear) || !t.year)
      )?.targetTime || null;
      
      const difference = targetTime !== null ? averageTime - targetTime : null;
      const percentDiff = targetTime !== null ? (averageTime / targetTime - 1) * 100 : null;
      
      return {
        route,
        flightCount,
        averageTime,
        targetTime,
        difference,
        percentDiff
      };
    });
    
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
  }, [flights, targetTimes, selectedMonth, selectedYear, selectedAircraft, selectedPilot, sortField, sortDirection]);
  
  const toggleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);
  
  const resetFilters = useCallback(() => {
    setSelectedMonth('all-months');
    setSelectedYear('all-years');
    setSelectedAircraft('all-aircraft');
    setSelectedPilot('all-pilots');
  }, []);
  
  const fetchTargetTimes = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    
    try {
      const { data, error } = await supabase
        .from('route_target_times')
        .select('*')
        .limit(100);
      
      if (error) throw error;
      
      if (data) {
        const formattedTargets: RouteTargetTime[] = data.map(item => ({
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
        
        setTargetTimes(formattedTargets);
        toast({
          title: "Data Refreshed",
          description: "Target times have been updated successfully",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Error fetching target times:', error);
      setHasError(true);
      setErrorMessage(error.message || 'Failed to load target times from the server');
      toast({
        title: 'Error',
        description: 'Failed to load target times.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isLoading]);
  
  const fetchAircraftAndPilots = useCallback(async () => {
    setIsAircraftPilotLoading(true);
    setAircraftPilotError(null);
    
    try {
      // Fetch aircraft using the service function
      const aircraftResult = await getAllAircraft();
      if (!aircraftResult.success) {
        throw new Error(aircraftResult.error?.message || 'Failed to fetch aircraft data');
      }
      setAircraft(aircraftResult.aircraft || []);
      console.log("Successfully fetched aircraft:", aircraftResult.aircraft?.length || 0);
      
      // Fetch pilots using the service function
      const pilotsResult = await getAllPilots();
      if (!pilotsResult.success) {
        throw new Error(pilotsResult.error?.toString() || 'Failed to fetch pilots data');
      }
      setPilots(pilotsResult.pilots || []);
      console.log("Successfully fetched pilots:", pilotsResult.pilots?.length || 0);
    } catch (error: any) {
      console.error('Error fetching aircraft and pilots:', error);
      setAircraftPilotError(error.message || 'Failed to load aircraft and pilot data.');
      
      // Replace toast.error with sonner toast
      sonnerToast.error('Failed to load aircraft and pilot data.');
    } finally {
      setIsAircraftPilotLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchAircraftAndPilots();
  }, [fetchAircraftAndPilots]);
  
  const handleUpdateTargetTimes = useCallback((newTargetTimes: RouteTargetTime[]) => {
    setTargetTimes(newTargetTimes);
  }, []);

  // Retry aircraft and pilot data fetch if there was an error
  const handleRetryFetch = () => {
    fetchAircraftAndPilots();
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-6 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-blue-600 gap-2">
            <Target className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Route Performance Analysis</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={fetchTargetTimes}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
        <p className="text-muted-foreground mb-2">Compare actual flight times against target times by route</p>
        {hasError && (
          <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Failed to load target times from the server</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
        
        {aircraftPilotError && (
          <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Failed to load aircraft and pilot data.</p>
              <p>{aircraftPilotError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleRetryFetch}
                disabled={isAircraftPilotLoading}
              >
                {isAircraftPilotLoading ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        )}
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
        aircraft={aircraft}
        pilots={pilots}
        isLoading={isAircraftPilotLoading}
      />
      
      {isAdmin && (
        <TargetManagement
          selectedAircraft={selectedAircraft}
          selectedPilot={selectedPilot}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          targetTimes={targetTimes}
          setTargetTimes={handleUpdateTargetTimes}
          refetchTargetTimes={fetchTargetTimes}
        />
      )}
      
      <div className="flex items-center space-x-4 mb-4 border-b pb-2">
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
      
      {isLoading || isAircraftPilotLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {isLoading ? 'Loading route data...' : 'Loading aircraft and pilot data...'}
            </p>
          </div>
        </div>
      ) : (
        viewMode === 'table' ? (
          <DataTable
            chartData={chartData}
            sortField={sortField}
            sortDirection={sortDirection}
            toggleSort={toggleSort}
            isUserAdmin={isAdmin}
            targetTimes={targetTimes}
            setTargetTimes={handleUpdateTargetTimes}
            refetchTargetTimes={fetchTargetTimes}
            selectedAircraft={selectedAircraft}
            selectedPilot={selectedPilot}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        ) : (
          <DataChart chartData={chartData} />
        )
      )}
    </div>
  );
};
