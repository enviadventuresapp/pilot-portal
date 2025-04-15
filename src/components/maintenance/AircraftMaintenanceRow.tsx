import { useState } from 'react';
import { Aircraft, AircraftMaintenance, MaintenanceItem } from '@/types';
import { Plane, Clock, AlertCircle, ChevronDown, ChevronUp, Edit, ShieldAlert, Trash2, Delete, Edit2, DeleteIcon } from 'lucide-react';
import { TableRow, TableCell } from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

interface MaintenanceStatusProps {
  status: 'due' | 'warning' | 'ok' | 'unknown';
  hoursRemaining: number;
  lastDone: number | null;
}

function MaintenanceStatus({ status, hoursRemaining, lastDone }: MaintenanceStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'due':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'ok':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Clock className={`h-4 w-4 ${getStatusColor(status)}`} />
        <span className="font-medium">
          Last done: {lastDone?.toFixed(1) || 'N/A'} hrs
        </span>
      </div>
      <div className={`text-sm ${getStatusColor(status)}`}>
        {hoursRemaining <= 0 ? (
          <span className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <strong>Inspection Due Now!</strong>
          </span>
        ) : (
          `${hoursRemaining.toFixed(1)} hours until due`
        )}
      </div>
    </div>
  );
}

interface AdditionalMaintenanceItemProps {
  item: MaintenanceItem | undefined;
  currentTach: number;
  onEdit: (item: MaintenanceItem) => void;
  itemKey: string;
  isAdmin: boolean;
}

function AdditionalMaintenanceItem({ item, currentTach, onEdit, itemKey, isAdmin }: AdditionalMaintenanceItemProps) {
  if (!item) return null;

  const hoursRemaining = item.lastDone !== null ?
    (item.lastDone + item.interval) - currentTach : 0;

  let status: 'due' | 'warning' | 'ok' | 'unknown' = 'unknown';

  if (item.lastDone === null) {
    status = 'unknown';
  } else if (hoursRemaining <= 0) {
    status = 'due';
  } else if (hoursRemaining <= 10) {
    status = 'warning';
  } else {
    status = 'ok';
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'due':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'ok':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="border-b border-border last:border-0 py-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{item.name}</div>
          {item.description && (
            <div className="text-sm text-muted-foreground">{item.description}</div>
          )}
          <div className="mt-1 flex items-center gap-1">
            <span className="text-sm">Interval: <strong>{item.interval}</strong> hours</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-medium ${getStatusColor(status)}`}>
            {status === 'due' ? 'OVERDUE' :
              status === 'warning' ? 'DUE SOON' :
                status === 'ok' ? 'OK' : 'UNKNOWN'}
          </div>
          <div className="text-sm mt-1">
            Last done: <strong>{item.lastDone?.toFixed(1) || 'N/A'}</strong>
          </div>
          <div className={`text-sm ${getStatusColor(status)}`}>
            {hoursRemaining <= 0 && item.lastDone !== null ?
              <span className="flex items-center justify-end gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                <strong>Due now!</strong>
              </span> :
              item.lastDone !== null ?
                `${hoursRemaining.toFixed(1)} hours remaining` :
                'No data'
            }
          </div>
          <button
            onClick={() => onEdit(item)}
            className={`mt-2 text-xs flex items-center gap-1 ml-auto ${isAdmin ? 'bg-secondary hover:bg-secondary/80' : 'bg-secondary/50 cursor-not-allowed'} px-2 py-1 rounded-md transition-colors`}
            disabled={!isAdmin}
            title={!isAdmin ? "Only administrators can edit maintenance items" : "Edit maintenance item"}
          >
            {!isAdmin ? (
              <ShieldAlert className="h-3 w-3" />
            ) : (
              <Edit className="h-3 w-3" />
            )}
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

interface AircraftMaintenanceRowProps {
  aircraft: Aircraft;
  maintenanceRecord: AircraftMaintenance;
  currentTach: number;
  onEditAircraft: (aircraft: Aircraft) => void;
  onEditMaintenance: (record: AircraftMaintenance) => void;
  onDeleteAircraft: (id: string) => void;
  onUpdateMaintenanceItem: (aircraftId: string, itemType: string, item: MaintenanceItem) => void;
  isAdmin: boolean;
}

export function AircraftMaintenanceRow({
  aircraft,
  maintenanceRecord,
  currentTach,
  onEditAircraft,
  onEditMaintenance,
  onDeleteAircraft,
  onUpdateMaintenanceItem,
  isAdmin
}: AircraftMaintenanceRowProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ key: string, item: MaintenanceItem } | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const calculate50HourStatus = () => {
    if (maintenanceRecord.lastFiftyHour === null) return { status: 'unknown' as const, hoursRemaining: 0 };

    const nextDue = maintenanceRecord.lastFiftyHour + 50;
    const hoursRemaining = nextDue - currentTach;

    let status: 'due' | 'warning' | 'ok' | 'unknown' = 'unknown';

    if (hoursRemaining <= 0) {
      status = 'due';
    } else if (hoursRemaining <= 10) {
      status = 'warning';
    } else {
      status = 'ok';
    }

    return { status, hoursRemaining };
  };

  const calculate100HourStatus = () => {
    if (maintenanceRecord.lastHundredHour === null) return { status: 'unknown' as const, hoursRemaining: 0 };

    const nextDue = maintenanceRecord.lastHundredHour + 100;
    const hoursRemaining = nextDue - currentTach;

    let status: 'due' | 'warning' | 'ok' | 'unknown' = 'unknown';

    if (hoursRemaining <= 0) {
      status = 'due';
    } else if (hoursRemaining <= 10) {
      status = 'warning';
    } else {
      status = 'ok';
    }

    return { status, hoursRemaining };
  };

  const status50 = calculate50HourStatus();
  const status100 = calculate100HourStatus();

  const handleEdit50Hour = () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit maintenance records",
        variant: "destructive"
      });
      return;
    }

    const newValue = window.prompt(
      "Enter the tach time when the 50-hour inspection was last performed:",
      maintenanceRecord.lastFiftyHour?.toString() || ""
    );

    if (newValue !== null) {
      const value = newValue.trim() === "" ? null : parseFloat(newValue);

      if (newValue.trim() !== "" && isNaN(value as number)) {
        toast({
          title: "Invalid input",
          description: "Please enter a valid number",
          variant: "destructive"
        });
        return;
      }

      const updatedRecord = {
        ...maintenanceRecord,
        lastFiftyHour: value
      };

      onEditMaintenance(updatedRecord);

      toast({
        title: "50-hour inspection updated",
        description: `Updated to ${value?.toFixed(1) || 'N/A'} hours`
      });
    }
  };

  const handleEdit100Hour = () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit maintenance records",
        variant: "destructive"
      });
      return;
    }

    const newValue = window.prompt(
      "Enter the tach time when the 100-hour inspection was last performed:",
      maintenanceRecord.lastHundredHour?.toString() || ""
    );

    if (newValue !== null) {
      const value = newValue.trim() === "" ? null : parseFloat(newValue);

      if (newValue.trim() !== "" && isNaN(value as number)) {
        toast({
          title: "Invalid input",
          description: "Please enter a valid number",
          variant: "destructive"
        });
        return;
      }

      const updatedRecord = {
        ...maintenanceRecord,
        lastHundredHour: value
      };

      onEditMaintenance(updatedRecord);

      toast({
        title: "100-hour inspection updated",
        description: `Updated to ${value?.toFixed(1) || 'N/A'} hours`
      });
    }
  };

  const handleEditItem = () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit maintenance items",
        variant: "destructive"
      });
      return;
    }

    if (!editingItem) return;

    const lastDoneInput = document.getElementById('itemLastDone') as HTMLInputElement;
    const intervalInput = document.getElementById('itemInterval') as HTMLInputElement;
    const descriptionInput = document.getElementById('itemDescription') as HTMLTextAreaElement;

    const updatedItem = {
      ...editingItem.item,
      lastDone: lastDoneInput?.value ? parseFloat(lastDoneInput.value) : null,
      interval: parseFloat(intervalInput?.value || "0"),
      description: descriptionInput?.value || ''
    };

    onUpdateMaintenanceItem(aircraft.id, editingItem.key, updatedItem);
    setIsEditDialogOpen(false);
    setEditingItem(null);

    toast({
      title: "Maintenance item updated",
      description: `${updatedItem.name} has been updated.`
    });
  };

  const defaultItems = {
    transponderCheck: {
      name: "Transponder Check",
      lastDone: null,
      interval: 24 * 30.5, // ~24 months in days
      description: "FAA required transponder inspection"
    },
    eltBattery: {
      name: "ELT Battery",
      lastDone: null,
      interval: 365, // 1 year in days
      description: "Emergency Locator Transmitter battery replacement"
    },
    eltInspection: {
      name: "ELT Inspection",
      lastDone: null,
      interval: 365, // 1 year in days
      description: "Emergency Locator Transmitter inspection"
    },
    engineOverhaul: {
      name: "Engine Overhaul",
      lastDone: null,
      interval: 2000,
      description: "Complete engine overhaul"
    },
    magneto1: {
      name: "Magneto #1",
      lastDone: null,
      interval: 500,
      description: "Left magneto inspection"
    },
    magneto2: {
      name: "Magneto #2",
      lastDone: null,
      interval: 500,
      description: "Right magneto inspection"
    },
    propellerOH: {
      name: "Propeller Overhaul",
      lastDone: null,
      interval: 2000,
      description: "Propeller overhaul service"
    }
  };

  const additionalItems = {
    ...defaultItems,
    ...maintenanceRecord.additionalItems
  };

  const startEditingItem = (key: string, item: MaintenanceItem) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit maintenance items",
        variant: "destructive"
      });
      return;
    }

    setEditingItem({ key, item });
    setIsEditDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete aircraft",
        variant: "destructive"
      });
      return;
    }

    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (!isAdmin) return;

    onDeleteAircraft(aircraft.id);
    setConfirmDeleteOpen(false);
  };

  return (
    <>
      <TableRow className={isOpen ? "bg-muted/50" : ""}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            <span className="font-medium">{aircraft.tailNumber}</span>
          </div>
          <span className="text-xs text-muted-foreground block mt-1">
            {aircraft.make} {aircraft.model}
          </span>
        </TableCell>
        <TableCell>
          <span className="font-medium">{currentTach.toFixed(1)}</span>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-between">
            <MaintenanceStatus
              status={status50.status}
              hoursRemaining={status50.hoursRemaining}
              lastDone={maintenanceRecord.lastFiftyHour}
            />
            <button
              onClick={handleEdit50Hour}
              className={`p-1 rounded-md ${isAdmin ? 'hover:bg-secondary' : 'cursor-not-allowed opacity-50'} transition-colors`}
              aria-label="Edit 50-hour inspection"
              disabled={!isAdmin}
              title={!isAdmin ? "Only administrators can edit maintenance records" : "Edit 50-hour inspection"}
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-between">
            <MaintenanceStatus
              status={status100.status}
              hoursRemaining={status100.hoursRemaining}
              lastDone={maintenanceRecord.lastHundredHour}
            />
            <button
              onClick={handleEdit100Hour}
              className={`p-1 rounded-md ${isAdmin ? 'hover:bg-secondary' : 'cursor-not-allowed opacity-50'} transition-colors`}
              aria-label="Edit 100-hour inspection"
              disabled={!isAdmin}
              title={!isAdmin ? "Only administrators can edit maintenance records" : "Edit 100-hour inspection"}
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className="p-2 rounded-md hover:bg-secondary transition-colors"
                  aria-label={isOpen ? "Hide details" : "Show details"}
                >
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </CollapsibleTrigger>
            </Collapsible>

            {isAdmin ? (
              <div className='flex items-center gap-2'>


                <button onClick={() => onEditAircraft(aircraft)}>
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  className="text-red-500"
                  onClick={confirmDelete}
                >
                  <DeleteIcon className="h-4 w-4" />
                </button>

              </div>
            ) : (
              <button
                className="p-1 rounded-md opacity-50 cursor-not-allowed"
                disabled={true}
                title="Only administrators can edit aircraft"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
          </div>
        </TableCell>
      </TableRow>

      <TableRow className={isOpen ? "" : "hidden"}>
        <TableCell colSpan={5} className="p-0">
          <Collapsible open={isOpen}>
            <CollapsibleContent>
              <div className="p-4 bg-card/50 border-t">
                <h3 className="text-lg font-medium mb-4">Additional Maintenance Items</h3>
                <div className="space-y-0 divide-y divide-border">
                  {Object.entries(additionalItems).map(([key, item]) => (
                    <AdditionalMaintenanceItem
                      key={key}
                      itemKey={key}
                      item={item}
                      currentTach={currentTach}
                      onEdit={(item) => startEditingItem(key, item)}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.item.name}</DialogTitle>
            <DialogDescription>
              Update the maintenance record for {aircraft.tailNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="itemLastDone" className="text-sm font-medium">
                Last Performed (Tach Time)
              </label>
              <input
                id="itemLastDone"
                type="number"
                step="0.1"
                defaultValue={editingItem?.item.lastDone || ''}
                placeholder="Enter tach time"
                className="w-full px-3 py-2 rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="itemInterval" className="text-sm font-medium">
                Interval (Hours)
              </label>
              <input
                id="itemInterval"
                type="number"
                step="0.1"
                defaultValue={editingItem?.item.interval}
                className="w-full px-3 py-2 rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="itemDescription" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="itemDescription"
                defaultValue={editingItem?.item.description || ''}
                rows={3}
                className="w-full px-3 py-2 rounded-md border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditItem}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Aircraft</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {aircraft.tailNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirmed}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
