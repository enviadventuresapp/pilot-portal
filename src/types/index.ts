
// Pilot types
export interface PilotRecord {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string;
  isAdmin: boolean;
  isHidden: boolean;
  created_at?: string;
  updated_at?: string;
}

// Aircraft types
export interface Aircraft {
  id: string;
  tailNumber: string;
  make: string;
  model: string;
  year: number;
  category?: string;
  tachTime?: number;
  oilChange?: string;
  lastAnnual?: string;
  ownership?: string;
  imageUrl?: string;
  lastFlight?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Flight types
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
  createdAt: string;
  updatedAt: string;
}

// Safety Report types
export interface SafetyReport {
  id: string;
  reportDate: string;
  reporterId: string;
  reporterName?: string;
  category: string;
  description: string;
  severity: string;
  status: string; // Changed from enum to string to match DB
  actions?: string;
  location?: string;
  aircraftId?: string | null;
  aircraftTailNumber?: string;
  adminReview?: any; // Changed to any to match DB
  createdAt: string;
  updatedAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalFlights: number;
  totalHours: number;
  totalFuel: number;
  totalOil: number;
  activeAircraft: number;
  recentSquawks: Array<{
    id: string;
    aircraft: string;
    date: string;
    description: string;
  }>;
  safetyReports: {
    total: number;
    open: number;
    critical: number;
  };
}

// Route Target Times
export interface RouteTargetTime {
  id: string;
  route: string;
  targetTime: number;
  aircraftId?: string | null;
  pilotId?: string | null;
  year?: number | null;
  month?: number | null;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fullName: string;
}

export interface AuthResponse {
  success: boolean;
  user?: PilotRecord;
  error?: {
    message: string;
  };
}
