
import { Tables } from '@/types/supabase';

// Define common types used throughout the application

export interface PilotRecord {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  isAdmin: boolean;
  isHidden: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Aircraft {
  id: string;
  tail_number: string;
  type: string;
  make?: string;
  model?: string;
  year?: string;
  registration?: string;
  created_at?: string;
  updated_at?: string;
  // Additional UI-specific fields
  tailNumber?: string; // For UI compatibility
  maintenance_records?: MaintenanceRecord[];
  // UI display fields
  tachTime?: number;
  oilChange?: string;
  lastAnnual?: string;
  ownership?: string;
  imageUrl?: string;
  lastFlight?: string | null;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
}

export interface Flight {
  id: string;
  aircraftId: string;
  pilotId: string;
  pilotName?: string;
  date: string;
  departureTime?: string;
  tachStart: number;
  tachEnd: number;
  hobbsTime: number;
  fuelAdded?: number;
  oilAdded?: number;
  passengerCount?: number;
  route?: string;
  category?: string;
  squawks?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SafetyReport {
  id: string;
  reportDate: string;
  reporterId: string;
  reporterName?: string; // Added for UI display
  category: string;
  description: string;
  severity: string;
  status: "submitted" | "under-review" | "resolved" | "closed";
  actions: string;
  location?: string;
  aircraftId?: string;
  aircraftTailNumber?: string; // Added for UI display
  resolutionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  adminReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    notes?: string;
  };
}

export interface UserProfile {
  id: string;
  userId: string;
  pilotId?: string;
}

export interface MaintenanceType {
  id: string;
  name: string;
  interval: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  aircraft_id: string;
  maintenance_type_id: string;
  last_done: number | null;
  next_due: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  maintenance_type?: MaintenanceType;
}

export type MaintenanceItem = {
  id?: string;
  name: string;
  description?: string;
  interval: number;
  lastDone: number | null;
};

export interface AircraftMaintenance {
  aircraftId: string;
  lastFiftyHour: number | null;
  lastHundredHour: number | null;
  additionalItems?: Record<string, MaintenanceItem>;
}

export type RouteTargetTime = {
  id: string;
  route: string;
  targetTime: number;
  aircraftId?: string;
  pilotId?: string;
  year?: number;
  month?: number;
  createdAt?: string;
  updatedAt?: string;
};

export interface DashboardStats {
  totalFlights: number;
  totalHours: number;
  totalFuel: number;
  totalOil?: number;
  activeAircraft: number;
  safetyReports: {
    total: number;
    open: number;
    critical: number;
  };
  recentSquawks?: Array<{
    id: string;
    aircraft: string;
    date: string;
    description: string;
  }>;
}

export interface AircraftMaintenanceRowProps {
  aircraftId: string;
  tailNumber: string;
  make: string;
  model: string;
  year: number;
  maintenanceRecord: AircraftMaintenance;
  currentTach: Record<string, number>;
  onEditAircraft: (aircraft: Aircraft) => void;
  onEditMaintenance: (record: AircraftMaintenance) => Promise<void>;
  onDeleteAircraft: (id: string) => Promise<void>;
  onUpdateMaintenanceItem: (aircraftId: string, itemKey: string, item: any) => Promise<void>;
}
