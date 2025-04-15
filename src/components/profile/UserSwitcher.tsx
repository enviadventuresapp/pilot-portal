
import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PilotRecord } from '@/types';
import { UserCheck, ChevronDown, ChevronUp, ShieldCheck, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export function UserSwitcher() {
  const [pilots, setPilots] = useLocalStorage<PilotRecord[]>('pilots', []);
  const [currentUser, setCurrentUser] = useLocalStorage<PilotRecord | null>('currentUser', null);
  const { toast } = useToast();
  
  // Filter out hidden pilots
  const visiblePilots = pilots.filter(pilot => !pilot.isHidden);
  
  const handleUserChange = (userId: string) => {
    const selectedPilot = pilots.find(pilot => pilot.id === userId);
    if (selectedPilot) {
      setCurrentUser(selectedPilot);
      toast({
        title: "User Switched",
        description: `Now logged in as ${selectedPilot.name}${selectedPilot.isAdmin ? ' (Administrator)' : ''}`,
      });
    }
  };
  
  if (!currentUser || visiblePilots.length <= 1) return null;
  
  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-medium">Switch User</h2>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground mb-2">
          Select a different pilot to switch user context
        </p>
        
        <Select
          value={currentUser.id}
          onValueChange={handleUserChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a pilot" />
          </SelectTrigger>
          <SelectContent>
            {visiblePilots.map(pilot => (
              <SelectItem 
                key={pilot.id} 
                value={pilot.id}
                className="flex items-center"
              >
                <div className="flex items-center gap-2">
                  <span>{pilot.name}</span>
                  {pilot.isAdmin && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
