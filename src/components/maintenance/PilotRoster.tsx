
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PilotRecord } from '@/types';
import { PilotRosterRow } from './PilotRosterRow';
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
import { Plus, UserPlus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { usePilots } from '@/hooks/usePilots';
import { createPilot, updatePilot, deletePilot } from '@/services/pilotService';
import { generateId } from '@/lib/utils';

export function PilotRoster({isAdmin}:{isAdmin?:boolean}) {
  // Use currentUser from local storage for permissions checks
  const [currentUser] = useLocalStorage<PilotRecord | null>('currentUser', null);
  
  const [editingPilot, setEditingPilot] = useState<PilotRecord | null>(null);
  const [newPilotName, setNewPilotName] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Use the usePilots hook to fetch pilots from the database
  const { pilots, loading, error, fetchPilots } = usePilots();
  
  // Initialize current user if not set
  useEffect(() => {
    if (!currentUser && pilots.length > 0) {
      localStorage.setItem('currentUser', JSON.stringify(pilots[0]));
    }
  }, [pilots, currentUser]);
  
  // Handle adding or updating a pilot
  const handleAddPilot = async () => {
    if (!newPilotName.trim()) {
      toast({
        title: "Error",
        description: "Pilot name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (!editingPilot) {
        // Add new pilot
        const newPilot: Partial<PilotRecord> = {
          name: newPilotName.trim(),
          isAdmin: false,
          isHidden: false
        };
        
        const { success, pilot, error } = await createPilot(newPilot);
        
        if (!success || error) {
          throw new Error(error || 'Failed to create pilot');
        }
        
        toast({
          title: "Pilot Added",
          description: `${newPilot.name} has been added to the roster`
        });
        
        // Refresh pilots list
        fetchPilots();
      } else {
        // Update existing pilot
        const { success, error } = await updatePilot(editingPilot.id, {
          ...editingPilot,
          name: newPilotName.trim()
        });
        
        if (!success || error) {
          throw new Error(error || 'Failed to update pilot');
        }
        
        // Update currentUser if necessary
        if (currentUser && currentUser.id === editingPilot.id) {
          const updatedUser = { ...currentUser, name: newPilotName.trim() };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        
        toast({
          title: "Pilot Updated",
          description: `${newPilotName.trim()} has been updated`
        });
        
        // Refresh pilots list
        fetchPilots();
      }
    } catch (error) {
      console.error("Error saving pilot:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save pilot",
        variant: "destructive"
      });
    } finally {
      setNewPilotName('');
      setEditingPilot(null);
      setOpen(false);
    }
  };
  
  // Handle edit pilot action
  const handleEditPilot = (pilot: PilotRecord) => {
    setEditingPilot(pilot);
    setNewPilotName(pilot.name);
    setOpen(true);
  };
  
  // Handle delete pilot action
  const handleDeletePilot = async (id: string) => {
    const adminCount = pilots.filter(p => p.isAdmin).length;
    const pilotToDelete = pilots.find(p => p.id === id);
    
    if (pilotToDelete?.isAdmin && adminCount <= 1) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the last administrator",
        variant: "destructive"
      });
      return;
    }
    
    if (currentUser && currentUser.id === id) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete your own account",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { success, error } = await deletePilot(id);
      
      if (!success || error) {
        throw new Error(error || 'Failed to delete pilot');
      }
      
      toast({
        title: "Pilot Removed",
        description: `${pilotToDelete?.name || 'Pilot'} has been removed from the roster`
      });
      
      // Refresh pilots list
      fetchPilots();
    } catch (error) {
      console.error("Error deleting pilot:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete pilot",
        variant: "destructive"
      });
    }
  };
  
  // Handle toggling pilot visibility
  const handleToggleVisibility = async (id: string, isHidden: boolean) => {
    const pilotToUpdate = pilots.find(p => p.id === id);
    
    if (!pilotToUpdate) {
      toast({
        title: "Error",
        description: "Pilot not found",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { success, error } = await updatePilot(id, {
        ...pilotToUpdate,
        isHidden
      });
      
      if (!success || error) {
        throw new Error(error || 'Failed to update pilot visibility');
      }
      
      // Update currentUser if necessary
      if (currentUser && currentUser.id === id) {
        const updatedUser = { ...currentUser, isHidden };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      
      toast({
        title: isHidden ? "Pilot Hidden" : "Pilot Visible",
        description: `${pilotToUpdate.name || 'Pilot'} is now ${isHidden ? 'hidden from' : 'visible in'} the roster`
      });
      
      // Refresh pilots list
      fetchPilots();
    } catch (error) {
      console.error("Error updating pilot visibility:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update pilot visibility",
        variant: "destructive"
      });
    }
  };
  
  // Handle toggling admin status
  const handleToggleAdmin = async (id: string, isAdmin: boolean) => {
    if (!isAdmin) {
      const adminCount = pilots.filter(p => p.isAdmin).length;
      if (adminCount <= 1) {
        toast({
          title: "Cannot Remove Admin",
          description: "Cannot remove admin rights from the last administrator",
          variant: "destructive"
        });
        return;
      }
    }
    
    const pilotToUpdate = pilots.find(p => p.id === id);
    
    if (!pilotToUpdate) {
      toast({
        title: "Error",
        description: "Pilot not found",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { success, error } = await updatePilot(id, {
        ...pilotToUpdate,
        isAdmin
      });
      
      if (!success || error) {
        throw new Error(error || 'Failed to update admin status');
      }
      
      // Update currentUser if necessary
      if (currentUser && currentUser.id === id) {
        const updatedUser = { ...currentUser, isAdmin };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      
      toast({
        title: isAdmin ? "Admin Rights Granted" : "Admin Rights Revoked",
        description: `${pilotToUpdate.name || 'Pilot'} ${isAdmin ? 'now has' : 'no longer has'} administrator rights`
      });
      
      // Refresh pilots list
      fetchPilots();
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update admin status",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Pilot Roster</h3>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={!isAdmin}>
              <UserPlus className="h-4 w-4" />
              <span>Add Pilot</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPilot ? 'Edit Pilot' : 'Add New Pilot'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <label htmlFor="pilotName" className="text-sm font-medium">Pilot Name</label>
                <Input
                  id="pilotName"
                  placeholder="Enter pilot name"
                  value={newPilotName}
                  onChange={(e) => setNewPilotName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleAddPilot} disabled={!isAdmin}>
                {editingPilot ? 'Save Changes' : 'Add Pilot'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pilot Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  <p className="text-muted-foreground">Loading pilots...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  <p className="text-destructive">Error loading pilots: {error.message}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => fetchPilots()}
                  >
                    Try Again
                  </Button>
                </TableCell>
              </TableRow>
            ) : pilots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  <p className="text-muted-foreground">No pilots in roster</p>
                </TableCell>
              </TableRow>
            ) : (
              pilots.map(pilot => (
                <PilotRosterRow
                  key={pilot.id}
                  pilot={pilot}
                  onEdit={handleEditPilot}
                  onDelete={handleDeletePilot}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleAdmin={handleToggleAdmin}
                  currentUserIsAdmin={isAdmin}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
