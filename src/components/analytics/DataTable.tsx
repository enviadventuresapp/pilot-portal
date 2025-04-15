import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Save, Clock, Target, BarChart2, ArrowDownUp, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RouteTargetTime } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ChartDataItem {
  route: string;
  averageTime: number;
  targetTime: number | null;
  percentDiff: number | null;
  difference: number | null;
  flightCount: number;
}

interface DataTableProps {
  chartData: ChartDataItem[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  toggleSort: (field: string) => void;
  isUserAdmin: boolean;
  targetTimes: RouteTargetTime[];
  setTargetTimes: (targetTimes: RouteTargetTime[]) => void;
  refetchTargetTimes: () => void;
  selectedAircraft: string;
  selectedPilot: string;
  selectedMonth: string;
  selectedYear: string;
}

export function DataTable({
  chartData,
  sortField,
  sortDirection,
  toggleSort,
  isUserAdmin,
  targetTimes,
  setTargetTimes,
  refetchTargetTimes,
  selectedAircraft,
  selectedPilot,
  selectedMonth,
  selectedYear
}: DataTableProps) {
  const { toast } = useToast();
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [editingTargetTime, setEditingTargetTime] = useState<string>('');

  const handleSaveTargetTime = async (route: string) => {
    if (!isUserAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can set target times",
        variant: "destructive"
      });
      return;
    }
    
    if (!editingTargetTime.trim() || isNaN(parseFloat(editingTargetTime))) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number for the target time",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const existingTarget = targetTimes.find(t => 
        t.route.toUpperCase() === route.toUpperCase() &&
        (selectedAircraft && selectedAircraft !== 'all-aircraft' ? t.aircraftId === selectedAircraft : !t.aircraftId) &&
        (selectedPilot && selectedPilot !== 'all-pilots' ? t.pilotId === selectedPilot : !t.pilotId) &&
        (selectedMonth && selectedMonth !== 'all-months' ? t.month === parseInt(selectedMonth) : !t.month) &&
        (selectedYear && selectedYear !== 'all-years' ? t.year === parseInt(selectedYear) : !t.year)
      );
      
      if (existingTarget) {
        const { error } = await supabase
          .from('route_target_times')
          .update({ target_time: parseFloat(editingTargetTime) })
          .eq('id', existingTarget.id);
          
        if (error) throw error;
        
        const updatedTargetTimes = targetTimes.map(t => 
          t.id === existingTarget.id 
            ? { ...t, targetTime: parseFloat(editingTargetTime) }
            : t
        );
        setTargetTimes(updatedTargetTimes);
      } else {
        const newTargetTime = {
          route: route,
          target_time: parseFloat(editingTargetTime),
          aircraft_id: selectedAircraft !== 'all-aircraft' ? selectedAircraft : null,
          pilot_id: selectedPilot !== 'all-pilots' ? selectedPilot : null,
          month: selectedMonth !== 'all-months' ? parseInt(selectedMonth) : null,
          year: selectedYear !== 'all-years' ? parseInt(selectedYear) : null
        };
        
        const { data, error } = await supabase
          .from('route_target_times')
          .insert(newTargetTime)
          .select()
          .single();
          
        if (error) throw error;
        
        const newRouteTarget: RouteTargetTime = {
          id: data.id,
          route: data.route,
          targetTime: data.target_time,
          aircraftId: data.aircraft_id,
          pilotId: data.pilot_id,
          month: data.month,
          year: data.year,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        setTargetTimes([...targetTimes, newRouteTarget]);
      }
      
      toast({
        title: "Target Time Updated",
        description: `Set target time for ${route} to ${editingTargetTime} hours`,
        variant: "default"
      });
      
      setEditingRoute(null);
      setEditingTargetTime('');
      
      refetchTargetTimes();
    } catch (error) {
      console.error("Error saving target time:", error);
      toast({
        title: "Error",
        description: "Failed to update target time. Please try again.",
        variant: "destructive"
      });
    }
  };

  const onChangeTargetTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const parsedValue = parseFloat(inputValue);

    if (!isNaN(parsedValue) && parsedValue >= 0.0 && parsedValue <= 25.0) {
      setEditingTargetTime(inputValue);
    } else {
      toast({
        title: "Warning",
        description: "Target time should be from 0.0 to 25.0",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="rounded-md border shadow bg-white">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSort('route')}
            >
              <div className="flex items-center">
                <span>Route</span>
                {sortField === 'route' && (
                  <ArrowDownUp className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSort('averageTime')}
            >
              <div className="flex items-center justify-end gap-1">
                <Clock className="h-4 w-4" />
                <span>Avg Time</span>
                {sortField === 'averageTime' && (
                  <ArrowDownUp className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Target className="h-4 w-4" />
                <span>Target</span>
              </div>
            </TableHead>
            <TableHead className="text-right">Difference</TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSort('percentDiff')}
            >
              <div className="flex items-center justify-end gap-1">
                <BarChart2 className="h-4 w-4" />
                <span>% Diff</span>
                {sortField === 'percentDiff' && (
                  <ArrowDownUp className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Edit className="h-4 w-4" />
                <span>Edit Target</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chartData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center text-muted-foreground">
                  <MapPin className="h-10 w-10 mb-2 text-muted" />
                  <p className="text-lg">No route data available with current filters</p>
                  <p className="text-sm mt-1">Try adjusting your filter options or adding more flights</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            chartData.map(({ route, averageTime, targetTime, difference, percentDiff }) => (
              <TableRow key={route} className="hover:bg-blue-50/30">
                <TableCell className="font-medium">{route}</TableCell>
                <TableCell className="text-right font-mono">{averageTime.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {editingRoute === route ? (
                    <Input 
                      type="number"
                      step="0.1"
                      className="w-24 inline-block text-right"
                      value={editingTargetTime}
                      onChange={(e) => onChangeTargetTime(e)}
                    />
                  ) : (
                    <span className="font-mono">{targetTime?.toFixed(2) || '-'}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {difference !== null ? (
                    <span className={`font-mono ${difference > 0 ? "text-red-500" : "text-green-500"}`}>
                      {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {percentDiff !== null ? (
                    <span className={`font-mono ${percentDiff > 0 ? "text-red-500" : "text-green-500"}`}>
                      {percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(1)}%
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingRoute === route ? (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSaveTargetTime(route)}
                        className="gap-1 bg-green-500 hover:bg-green-600 text-white"
                        disabled={!isUserAdmin}
                      >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRoute(null)}
                        className="gap-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRoute(route);
                        setEditingTargetTime(targetTime?.toString() || '');
                      }}
                      className={`gap-1 bg-blue-50 hover:bg-blue-100 ${isUserAdmin
 ? 'hover:bg-secondary' : 'cursor-not-allowed opacity-50'} text-blue-700 border-blue-200`}
                      disabled={!isUserAdmin}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
