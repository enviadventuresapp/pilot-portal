
import { useState } from 'react';
import { Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { MaintenanceItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MaintenanceItemsProps {
  aircraftId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  maintenanceItems: Record<string, MaintenanceItem>;
  currentTach: number;
  onUpdateItem: (aircraftId: string, itemKey: string, item: MaintenanceItem) => void;
  isAdmin: boolean;
}

export function MaintenanceItems({
  aircraftId,
  isExpanded,
  onToggleExpand,
  maintenanceItems,
  currentTach,
  onUpdateItem,
  isAdmin
}: MaintenanceItemsProps) {
  const [editingItem, setEditingItem] = useState<MaintenanceItem | null>(null);
  const [editItemKey, setEditItemKey] = useState<string>('');
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemInterval, setEditItemInterval] = useState('');
  const [editItemLastDone, setEditItemLastDone] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleEditItem = (key: string, item: MaintenanceItem) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit maintenance items",
        variant: "destructive"
      });
      return;
    }
    
    setEditingItem(item);
    setEditItemKey(key);
    setEditItemName(item.name);
    setEditItemDescription(item.description || '');
    setEditItemInterval(item.interval?.toString() || '');
    setEditItemLastDone(item.lastDone?.toString() || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    
    const updatedItem: MaintenanceItem = {
      ...editingItem,
      name: editItemName,
      description: editItemDescription,
      interval: parseFloat(editItemInterval) || 0,
      lastDone: editItemLastDone ? parseFloat(editItemLastDone) : null
    };
    
    onUpdateItem(aircraftId, editItemKey, updatedItem);
    setIsEditDialogOpen(false);
  };

  const getItemStatus = (item: MaintenanceItem) => {
    if (!item.lastDone || !item.interval) return { status: 'UNKNOWN', hoursRemaining: null };
    
    const nextDue = item.lastDone + item.interval;
    const hoursRemaining = nextDue - (currentTach || 0);
    
    if (hoursRemaining > item.interval * 0.2) return { status: 'OK', hoursRemaining };
    if (hoursRemaining > 0) return { status: 'WARNING', hoursRemaining };
    return { status: 'OVERDUE', hoursRemaining };
  };

  if (!isExpanded) return null;

  return (
    <>
      <div className="py-2 px-4 bg-gray-50 border-t">
        <h4 className="text-lg font-medium mb-2">Additional Maintenance Items</h4>
      </div>
      
      {Object.entries(maintenanceItems || {}).map(([key, item]) => {
        const { status, hoursRemaining } = getItemStatus(item);
        
        return (
          <div key={key} className="border-t px-4 py-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-medium">{item.name}</h5>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    status === 'OK' ? 'bg-green-100 text-green-800' :
                    status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-sm mt-1">Interval: <span className="font-medium">{item.interval} hours</span></p>
              </div>
              
              <div className="flex flex-col items-end">
                {item.lastDone ? (
                  <>
                    <div className="text-sm text-right">Last done: <span className="font-medium">{item.lastDone}</span></div>
                    {hoursRemaining !== null && (
                      <div className={`text-sm ${
                        status === 'OK' ? 'text-green-600' :
                        status === 'WARNING' ? 'text-yellow-600' :
                        status === 'OVERDUE' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {hoursRemaining > 0 ? 
                          `${hoursRemaining.toFixed(1)} hours remaining` : 
                          `${Math.abs(hoursRemaining).toFixed(1)} hours overdue`
                        }
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">Last done: N/A</div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-1" 
                  onClick={() => handleEditItem(key, item)}
                  disabled={!isAdmin}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Maintenance Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="itemName" className="text-sm font-medium">Name</label>
                <Input
                  id="itemName"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="itemDescription" className="text-sm font-medium">Description</label>
                <Textarea
                  id="itemDescription"
                  value={editItemDescription}
                  onChange={(e) => setEditItemDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="itemInterval" className="text-sm font-medium">Interval (hours)</label>
                  <Input
                    id="itemInterval"
                    type="number"
                    value={editItemInterval}
                    onChange={(e) => setEditItemInterval(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="itemLastDone" className="text-sm font-medium">Last Done (tach time)</label>
                  <Input
                    id="itemLastDone"
                    type="number"
                    step="0.1"
                    value={editItemLastDone}
                    onChange={(e) => setEditItemLastDone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveItem} className="bg-blue-500 hover:bg-blue-600">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
