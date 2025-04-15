
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Aircraft, AircraftMaintenance as AircraftMaintenanceType, PilotRecord, Flight } from '@/types';
import { generateId } from '@/lib/utils';
import { AircraftMaintenanceRow } from './AircraftMaintenanceRow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PlaneTakeoff, ShieldAlert, Info } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface AircraftMaintenanceProps {
  isUserAdmin?: boolean;
}

export function AircraftMaintenance({ isUserAdmin = false }: AircraftMaintenanceProps) {
  const [aircraft, setAircraft] = useLocalStorage<Aircraft[]>('aircraft', []);
  const [maintenance, setMaintenance] = useLocalStorage<AircraftMaintenanceType[]>('aircraftMaintenance', []);
  const [currentTach, setCurrentTach] = useLocalStorage<Record<string, number>>('currentTach', {});
  const [flights] = useLocalStorage<Flight[]>('flights', []);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
  const [open, setOpen] = useState(false);
  const [currentUser] = useLocalStorage<PilotRecord | null>('currentUser', null);
  const { toast } = useToast();
  
  const [tailNumber, setTailNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [tachValue, setTachValue] = useState('');
  
  // Use the passed isUserAdmin prop primarily, but still check currentUser as fallback
  const isAdmin = isUserAdmin;
  
  // Update current tach time for each aircraft based on most recent flight
  useEffect(() => {
    if (flights.length > 0 && aircraft.length > 0) {
      const updatedTach = { ...currentTach };
      let tachUpdated = false;
      
      aircraft.forEach(a => {
        // Find flights for this aircraft sorted by date (newest first)
        const aircraftFlights = flights
          .filter(f => f.aircraftId === a.id)
          .sort((a, b) => {
            // Sort by date first (newest first)
            const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateComparison !== 0) return dateComparison;
            
            // If dates are the same, sort by departure time (newest first)
            // Note: If departureTime doesn't exist on some records, those records will be sorted after ones with departureTime
            const aTime = a.departureTime || "00:00";
            const bTime = b.departureTime || "00:00";
            return bTime.localeCompare(aTime);
          });
        
        // Update tach value if there are flights for this aircraft
        if (aircraftFlights.length > 0) {
          const latestTach = aircraftFlights[0].tachEnd;
          
          // Only update if the value is different to avoid unnecessary state updates
          if (updatedTach[a.id] !== latestTach) {
            updatedTach[a.id] = latestTach;
            tachUpdated = true;
          }
        }
      });
      
      // Only update state if there were changes
      if (tachUpdated) {
        setCurrentTach(updatedTach);
        toast({
          title: "Tach Times Updated",
          description: "Aircraft tach times have been updated based on the latest flight data.",
        });
      }
    }
  }, [flights, aircraft]);
  
  useEffect(() => {
    if (aircraft.length === 0) {
      const defaultAircraft: Aircraft = {
        id: generateId(),
        tailNumber: 'N12345',
        make: 'Cessna',
        model: '172',
        year: 2010
      };
      setAircraft([defaultAircraft]);
      
      const defaultMaintenance: AircraftMaintenanceType = {
        aircraftId: defaultAircraft.id,
        lastFiftyHour: 1250.4,
        lastHundredHour: 1200.6,
        additionalItems: {
          transponderCheck: { 
            name: "Transponder Check", 
            lastDone: 1100.5, 
            interval: 24 * 30.5, // ~24 months in days
            description: "FAA required transponder inspection"
          },
          eltBattery: { 
            name: "ELT Battery", 
            lastDone: 1150.2, 
            interval: 365, // 1 year in days
            description: "Emergency Locator Transmitter battery replacement"
          },
          eltInspection: { 
            name: "ELT Inspection", 
            lastDone: null, 
            interval: 365, // 1 year in days
            description: "Emergency Locator Transmitter inspection"
          }
        }
      };
      setMaintenance([defaultMaintenance]);
      
      setCurrentTach({
        [defaultAircraft.id]: 1275.8
      });
    }
  }, []);
  
  const handleAddAircraft = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can add or modify aircraft",
        variant: "destructive"
      });
      return;
    }
    
    if (!tailNumber.trim()) {
      toast({
        title: "Error",
        description: "Tail number is required",
        variant: "destructive"
      });
      return;
    }
    
    const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const parsedTach = tachValue ? parseFloat(tachValue) : 0;
    
    if (year && isNaN(parsedYear)) {
      toast({
        title: "Error",
        description: "Year must be a valid number",
        variant: "destructive"
      });
      return;
    }
    
    if (tachValue && isNaN(parsedTach)) {
      toast({
        title: "Error",
        description: "Tach time must be a valid number",
        variant: "destructive"
      });
      return;
    }
    
    const tailExists = aircraft.some(a => 
      a.tailNumber.toLowerCase() === tailNumber.trim().toLowerCase() && 
      (!editingAircraft || a.id !== editingAircraft.id)
    );
    
    if (tailExists) {
      toast({
        title: "Error",
        description: "An aircraft with this tail number already exists",
        variant: "destructive"
      });
      return;
    }
    
    if (!editingAircraft) {
      const newAircraft: Aircraft = {
        id: crypto.randomUUID(),
        tailNumber: tailNumber.trim(),
        make: make.trim(),
        type: make.trim(),
        model: model.trim(),
        year: parsedYear,
        category: 'single',
        created_at: new Date().toISOString(),
        imageUrl: '',
        lastAnnual: null,
        lastFiveYear: null,
        lastTenYear: null
      };
      
      setAircraft([...aircraft, newAircraft]);
      
      // Add to Supabase if connected
      try {
        const { error } = await supabase
          .from('aircraft')
          .insert({
            id: newAircraft.id,
            tail_number: newAircraft.tailNumber,
            make: newAircraft.make,
            type: newAircraft.make,
            model: newAircraft.model,
            year: newAircraft.year
          });
          
        if (error) throw error;
      } catch (error) {
        console.error("Error adding aircraft to Supabase:", error);
        // Continue with local storage only
      }
      
      const newMaintenance: AircraftMaintenanceType = {
        aircraftId: newAircraft.id,
        lastFiftyHour: null,
        lastHundredHour: null
      };
      
      setMaintenance([...maintenance, newMaintenance]);
      
      // Add maintenance to Supabase if connected
      try {
        const { error } = await supabase
          .from('maintenance')
          .insert({
            aircraft_id: newMaintenance.aircraftId,
            last_fifty_hour: newMaintenance.lastFiftyHour,
            last_hundred_hour: newMaintenance.lastHundredHour
          });
          
        if (error) throw error;
      } catch (error) {
        console.error("Error adding maintenance to Supabase:", error);
        // Continue with local storage only
      }
      
      setCurrentTach({
        ...currentTach,
        [newAircraft.id]: parsedTach
      });
      
      toast({
        title: "Aircraft Added",
        description: `${newAircraft.tailNumber} has been added to the fleet`
      });
    } else {
      const updatedAircraft = aircraft.map(a => 
        a.id === editingAircraft.id 
          ? { 
              ...a, 
              tailNumber: tailNumber.trim(),
              make: make.trim(),
              model: model.trim(),
              year: parsedYear
            } 
          : a
      );
      
      setAircraft(updatedAircraft);
      
      // Update in Supabase if connected
      try {
        const { error } = await supabase
          .from('aircraft')
          .update({
            tail_number: tailNumber.trim(),
            make: make.trim(),
            model: model.trim(),
            year: parsedYear
          })
          .eq('id', editingAircraft.id);
          
        if (error) throw error;
      } catch (error) {
        console.error("Error updating aircraft in Supabase:", error);
        // Continue with local storage update only
      }
      
      if (tachValue) {
        setCurrentTach({
          ...currentTach,
          [editingAircraft.id]: parsedTach
        });
      }
      
      toast({
        title: "Aircraft Updated",
        description: `${tailNumber.trim()} has been updated`
      });
    }
    
    resetForm();
    setOpen(false);
  };
  
  const handleEditAircraft = (aircraft: Aircraft) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit aircraft information",
        variant: "destructive"
      });
      return;
    }
    
    setEditingAircraft(aircraft);
    setTailNumber(aircraft.tailNumber);
    setMake(aircraft.make || '');
    setModel(aircraft.model || '');
    setYear(aircraft.year?.toString() || '');
    setTachValue(currentTach[aircraft.id]?.toString() || '');
    setOpen(true);
  };
  
  const handleDeleteAircraft = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can remove aircraft",
        variant: "destructive"
      });
      return;
    }
    
    const updatedAircraft = aircraft.filter(a => a.id !== id);
    setAircraft(updatedAircraft);
    
    // Delete from Supabase if connected
    try {
      const { error } = await supabase
        .from('aircraft')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting aircraft from Supabase:", error);
      // Continue with local storage deletion only
    }
    
    const updatedMaintenance = maintenance.filter(m => m.aircraftId !== id);
    setMaintenance(updatedMaintenance);
    
    // Delete maintenance from Supabase if connected
    try {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('aircraft_id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting maintenance from Supabase:", error);
      // Continue with local storage deletion only
    }
    
    const updatedTach = { ...currentTach };
    delete updatedTach[id];
    setCurrentTach(updatedTach);
    
    const aircraftToDelete = aircraft.find(a => a.id === id);
    toast({
      title: "Aircraft Removed",
      description: `${aircraftToDelete?.tailNumber || 'Aircraft'} has been removed from the fleet`
    });
  };
  
  const handleEditMaintenance = async (record: AircraftMaintenanceType) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit maintenance records",
        variant: "destructive"
      });
      return;
    }
    
    const updatedMaintenance = maintenance.map(m => 
      m.aircraftId === record.aircraftId ? record : m
    );
    
    setMaintenance(updatedMaintenance);
    
    // Update in Supabase if connected
    try {
      const { error } = await supabase
        .from('maintenance')
        .update({
          last_fifty_hour: record.lastFiftyHour,
          last_hundred_hour: record.lastHundredHour
        })
        .eq('aircraft_id', record.aircraftId);
        
      if (error) throw error;
    } catch (error) {
      console.error("Error updating maintenance in Supabase:", error);
      // Continue with local storage update only
    }
  };
  
  const handleUpdateMaintenanceItem = async (aircraftId: string, itemKey: string, item: any) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit maintenance items",
        variant: "destructive"
      });
      return;
    }
    
    const record = maintenance.find(m => m.aircraftId === aircraftId);
    
    if (record) {
      const additionalItems = record.additionalItems || {};
      
      const updatedRecord = {
        ...record,
        additionalItems: {
          ...additionalItems,
          [itemKey]: item
        }
      };
      
      handleEditMaintenance(updatedRecord);
      
      // Update maintenance items in Supabase if connected
      try {
        // First check if the item exists
        const { data, error: fetchError } = await supabase
          .from('maintenance_items')
          .select()
          .eq('maintenance_id', aircraftId)
          .eq('name', item.name);
          
        if (fetchError) throw fetchError;
        
        if (data && data.length > 0) {
          // Update existing item
          const { error } = await supabase
            .from('maintenance_items')
            .update({
              last_done: item.lastDone,
              interval: item.interval,
              description: item.description
            })
            .eq('maintenance_id', aircraftId)
            .eq('name', item.name);
            
          if (error) throw error;
        } else {
          // Insert new item
          const { error } = await supabase
            .from('maintenance_items')
            .insert({
              maintenance_id: aircraftId,
              name: item.name,
              last_done: item.lastDone,
              interval: item.interval,
              description: item.description
            });
            
          if (error) throw error;
        }
      } catch (error) {
        console.error("Error updating maintenance item in Supabase:", error);
        // Continue with local storage update only
      }
    }
  };
  
  const resetForm = () => {
    setEditingAircraft(null);
    setTailNumber('');
    setMake('');
    setModel('');
    setYear('');
    setTachValue('');
  };
  
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Aircraft Maintenance</h3>
        
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (!isAdmin && isOpen) {
            toast({
              title: "Permission Denied",
              description: "Only administrators can add aircraft",
              variant: "destructive"
            });
            return;
          }
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="gap-1"
              disabled={!isAdmin}
              title={!isAdmin ? "Only administrators can add aircraft" : "Add Aircraft"}
            >
              {!isAdmin ? (
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              ) : (
                <PlaneTakeoff className="h-4 w-4" />
              )}
              <span>Add Aircraft</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAircraft ? 'Edit Aircraft' : 'Add New Aircraft'}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="tailNumber" className="text-sm font-medium">Tail Number *</label>
                <Input
                  id="tailNumber"
                  placeholder="N12345"
                  value={tailNumber}
                  onChange={(e) => setTailNumber(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="make" className="text-sm font-medium">Make</label>
                <Input
                  id="make"
                  placeholder="Cessna"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="model" className="text-sm font-medium">Model</label>
                <Input
                  id="model"
                  placeholder="172"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium">Year</label>
                <Input
                  id="year"
                  type="number"
                  placeholder={new Date().getFullYear().toString()}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="tachTime" className="text-sm font-medium">Current Tach Time</label>
                <div className="relative">
                  <Input
                    id="tachTime"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={tachValue}
                    onChange={(e) => setTachValue(e.target.value)}
                  />
                  {editingAircraft && flights.some(f => f.aircraftId === editingAircraft.id) && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      <span>This will be updated automatically from flight records after save.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleAddAircraft}>
                {editingAircraft ? 'Save Changes' : 'Add Aircraft'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aircraft</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <span>Tach Time</span>
                  <span className="text-xs text-muted-foreground">(from flights)</span>
                </div>
              </TableHead>
              <TableHead>50 Hour</TableHead>
              <TableHead>100 Hour</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aircraft.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No aircraft in fleet</p>
                </TableCell>
              </TableRow>
            ) : (
              aircraft.map(a => {
                const maintenanceRecord = maintenance.find(m => m.aircraftId === a.id) || {
                  aircraftId: a.id,
                  lastFiftyHour: null,
                  lastHundredHour: null
                };
                
                return (
                  <AircraftMaintenanceRow
                    key={a.id}
                    aircraft={a}
                    maintenanceRecord={maintenanceRecord}
                    currentTach={currentTach[a.id] || 0}
                    onEditAircraft={handleEditAircraft}
                    onEditMaintenance={handleEditMaintenance}
                    onDeleteAircraft={handleDeleteAircraft}
                    onUpdateMaintenanceItem={handleUpdateMaintenanceItem}
                    isAdmin={isAdmin}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
