
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RouteTargetTime } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface TargetManagementProps {
  selectedAircraft: string;
  selectedPilot: string;
  selectedMonth: string;
  selectedYear: string;
  targetTimes: RouteTargetTime[];
  setTargetTimes: (targetTimes: RouteTargetTime[]) => void;
  refetchTargetTimes: () => void;
}

export function TargetManagement({
  selectedAircraft,
  selectedPilot,
  selectedMonth,
  selectedYear,
  targetTimes,
  setTargetTimes,
  refetchTargetTimes
}: TargetManagementProps) {
  const { toast } = useToast();
  const { isAdmin } = useAuthContext();
  const [newRoute, setNewRoute] = useState<string>('');
  const [newTargetTime, setNewTargetTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTargetTime = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can add target times",
        variant: "destructive"
      });
      return;
    }
    
    if (!newRoute.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a route",
        variant: "destructive"
      });
      return;
    }
    
    if (!newTargetTime.trim() || isNaN(parseFloat(newTargetTime))) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number for the target time",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newTargetTimeObj = {
        route: newRoute.trim().toUpperCase(),
        target_time: parseFloat(newTargetTime),
        aircraft_id: selectedAircraft !== 'all-aircraft' ? selectedAircraft : null,
        pilot_id: selectedPilot !== 'all-pilots' ? selectedPilot : null,
        month: selectedMonth !== 'all-months' ? parseInt(selectedMonth) : null,
        year: selectedYear !== 'all-years' ? parseInt(selectedYear) : null
      };
      
      const { data, error } = await supabase
        .from('route_target_times')
        .insert(newTargetTimeObj)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
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
        
        toast({
          title: "Target Time Added",
          description: `Added target time for ${newRoute.toUpperCase()} as ${newTargetTime} hours`,
          variant: "default"
        });
        
        setNewRoute('');
        setNewTargetTime('');
        
        refetchTargetTimes();
      }
    } catch (error: any) {
      console.error("Error adding target time:", error);
      setError(error.message || "Failed to add target time");
      toast({
        title: "Error",
        description: "Failed to add target time. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium flex items-center gap-2 text-gray-700">
          <Star className="h-5 w-5 text-amber-500" />
          <span>Target Time Management</span>
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1 text-muted-foreground">Route</label>
          <Input 
            value={newRoute} 
            onChange={(e) => setNewRoute(e.target.value)} 
            placeholder="e.g. VV"
            className="w-full bg-white"
            disabled={!isAdmin || isSubmitting}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1 text-muted-foreground">Target Time (hours)</label>
          <Input 
            type="number" 
            step="0.1" 
            value={newTargetTime} 
            onChange={(e) => setNewTargetTime(e.target.value)}
            placeholder="e.g. 0.4" 
            className="w-full bg-white"
            disabled={!isAdmin || isSubmitting}
          />
        </div>
        <div className="flex items-end">
          <Button 
            onClick={handleAddTargetTime}
            className="w-full gap-2"
            variant="default"
            disabled={!isAdmin || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Add New Target Time</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error adding target time</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-sm flex items-start text-gray-600 bg-blue-50 rounded-md p-3 border border-blue-100">
        <AlertCircle className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p>Target times will be applied based on current filter settings:</p>
          <ul className="mt-1 ml-5 list-disc text-xs">
            {selectedAircraft !== 'all-aircraft' && <li>Specific to the selected aircraft</li>}
            {selectedPilot !== 'all-pilots' && <li>Specific to the selected pilot</li>}
            {selectedMonth !== 'all-months' && <li>Only for the selected month</li>}
            {selectedYear !== 'all-years' && <li>Only for the selected year</li>}
            {selectedAircraft === 'all-aircraft' && selectedPilot === 'all-pilots' && 
             selectedMonth === 'all-months' && selectedYear === 'all-years' && 
             <li>Global target time for all aircraft, pilots, and time periods</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
