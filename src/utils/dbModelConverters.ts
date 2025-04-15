
import { Flight, Aircraft, PilotRecord, SafetyReport, RouteTargetTime } from '@/types';

// DB Types (matching Supabase table structures)
export interface DbFlight {
  id: string;
  aircraft_id: string;
  pilot_id: string;
  pilot_name?: string;
  date: string;
  departure_time?: string;
  tach_start: number;
  tach_end: number;
  hobbs_time: number;
  fuel_added?: number;
  oil_added?: number;
  passenger_count?: number;
  route?: string;
  category?: string;
  squawks?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DbAircraft {
  id: string;
  tail_number: string;
  make?: string;
  model?: string;
  year?: string;
  category?: string;
  tach_time?: number;
  oil_change?: string;
  last_annual?: string;
  ownership?: string;
  image_url?: string;
  last_flight?: string;
  type: string;
  registration?: string;
  created_at: string;
  updated_at: string;
}

export interface DbPilot {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  is_admin: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSafetyReport {
  id: string;
  report_date: string;
  reporter_id: string;
  reported_by?: string; // Changed from reporter_name to reported_by to match DB schema
  category: string;
  description: string;
  severity: string;
  status: string;
  actions?: string;
  location?: string;
  aircraft_id?: string;
  admin_review?: any;
  created_at: string;
  updated_at: string;
}

export interface DbRouteTargetTime {
  id: string;
  route: string;
  target_time: number;
  aircraft_id?: string;
  pilot_id?: string;
  year?: number;
  month?: number;
  created_at: string;
  updated_at: string;
}

// DB to App Model Converters
export const dbFlightToFlight = (dbFlight: DbFlight): Flight => {
  return {
    id: dbFlight.id,
    aircraftId: dbFlight.aircraft_id,
    pilotId: dbFlight.pilot_id,
    pilotName: dbFlight.pilot_name || '',
    date: dbFlight.date,
    departureTime: dbFlight.departure_time,
    tachStart: dbFlight.tach_start,
    tachEnd: dbFlight.tach_end,
    hobbsTime: dbFlight.hobbs_time,
    fuelAdded: dbFlight.fuel_added || 0,
    oilAdded: dbFlight.oil_added || 0,
    passengerCount: dbFlight.passenger_count || 0,
    route: dbFlight.route || '',
    category: dbFlight.category || '',
    squawks: dbFlight.squawks || '',
    notes: dbFlight.notes || '',
    createdAt: dbFlight.created_at,
    updatedAt: dbFlight.updated_at
  };
};

export const dbAircraftToAircraft = (dbAircraft: DbAircraft): Aircraft => {
  return {
    id: dbAircraft.id,
    tail_number: dbAircraft.tail_number,
    tailNumber: dbAircraft.tail_number, // For UI compatibility
    make: dbAircraft.make,
    model: dbAircraft.model,
    year: dbAircraft.year,
    type: dbAircraft.type,
    registration: dbAircraft.registration,
    created_at: dbAircraft.created_at,
    updated_at: dbAircraft.updated_at,
    // UI display fields
    tachTime: dbAircraft.tach_time,
    oilChange: dbAircraft.oil_change,
    lastAnnual: dbAircraft.last_annual,
    ownership: dbAircraft.ownership,
    imageUrl: dbAircraft.image_url,
    lastFlight: dbAircraft.last_flight,
    createdAt: dbAircraft.created_at,
    updatedAt: dbAircraft.updated_at,
    category: dbAircraft.category
  };
};

export const dbPilotToPilot = (dbPilot: DbPilot): PilotRecord => {
  return {
    id: dbPilot.id,
    user_id: dbPilot.user_id,
    name: dbPilot.name,
    email: dbPilot.email,
    isAdmin: dbPilot.is_admin,
    isHidden: dbPilot.is_hidden,
    created_at: dbPilot.created_at,
    updated_at: dbPilot.updated_at
  };
};

export const dbSafetyReportToSafetyReport = (dbReport: DbSafetyReport): SafetyReport => {
  if (!dbReport) {
    console.error("Invalid safety report data received:", dbReport);
    throw new Error("Invalid safety report data");
  }
  
  try {
    return {
      id: dbReport.id,
      reportDate: dbReport.report_date,
      reporterId: dbReport.reporter_id,
      reporterName: dbReport.reported_by || "", // Use reported_by from DB for reporterName in UI
      category: dbReport.category,
      description: dbReport.description,
      severity: dbReport.severity,
      status: dbReport.status as "submitted" | "under-review" | "resolved" | "closed",
      actions: dbReport.actions || "",
      location: dbReport.location,
      aircraftId: dbReport.aircraft_id,
      adminReview: dbReport.admin_review,
      createdAt: dbReport.created_at,
      updatedAt: dbReport.updated_at
    };
  } catch (error) {
    console.error("Error converting safety report:", error, dbReport);
    throw new Error(`Error converting safety report: ${String(error)}`);
  }
};

export const dbRouteTargetTimeToRouteTargetTime = (dbTime: DbRouteTargetTime): RouteTargetTime => {
  return {
    id: dbTime.id,
    route: dbTime.route,
    targetTime: dbTime.target_time,
    aircraftId: dbTime.aircraft_id,
    pilotId: dbTime.pilot_id,
    year: dbTime.year,
    month: dbTime.month,
    createdAt: dbTime.created_at,
    updatedAt: dbTime.updated_at
  };
};

// App Model to DB Converters
export const flightToDbFlight = (flight: Partial<Flight>): Partial<DbFlight> => {
  return {
    ...(flight.id && { id: flight.id }),
    ...(flight.aircraftId && { aircraft_id: flight.aircraftId }),
    ...(flight.pilotId && { pilot_id: flight.pilotId }),
    ...(flight.date && { date: flight.date }),
    ...(flight.departureTime !== undefined && { departure_time: flight.departureTime }),
    ...(flight.tachStart !== undefined && { tach_start: flight.tachStart }),
    ...(flight.tachEnd !== undefined && { tach_end: flight.tachEnd }),
    ...(flight.hobbsTime !== undefined && { hobbs_time: flight.hobbsTime }),
    ...(flight.fuelAdded !== undefined && { fuel_added: flight.fuelAdded }),
    ...(flight.oilAdded !== undefined && { oil_added: flight.oilAdded }),
    ...(flight.passengerCount !== undefined && { passenger_count: flight.passengerCount }),
    ...(flight.route !== undefined && { route: flight.route }),
    ...(flight.category !== undefined && { category: flight.category }),
    ...(flight.squawks !== undefined && { squawks: flight.squawks }),
    ...(flight.notes !== undefined && { notes: flight.notes })
  };
};

export const aircraftToDbAircraft = (aircraft: Partial<Aircraft>): Partial<DbAircraft> => {
  // Create an object with the required type property
  const dbAircraft: Partial<DbAircraft> = {
    ...(aircraft.id && { id: aircraft.id }),
    ...(aircraft.tailNumber && { tail_number: aircraft.tailNumber }),
    ...(aircraft.tail_number && { tail_number: aircraft.tail_number }),
    ...(aircraft.make && { make: aircraft.make }),
    ...(aircraft.model && { model: aircraft.model }),
    ...(aircraft.year && { year: aircraft.year }),
    ...(aircraft.type && { type: aircraft.type }),
    ...(aircraft.type === undefined && { type: aircraft.make || 'unknown' }) // Fallback for type if missing
  };

  return dbAircraft;
};

export const pilotToDbPilot = (pilot: Partial<PilotRecord>): Partial<DbPilot> => {
  // Make sure name is always provided for inserts
  if (!pilot.name && !pilot.id) {
    throw new Error('Pilot name is required for new pilots');
  }
  
  return {
    ...(pilot.id && { id: pilot.id }),
    ...(pilot.user_id && { user_id: pilot.user_id }),
    ...(pilot.name && { name: pilot.name }),
    ...(pilot.email && { email: pilot.email }),
    ...(pilot.isAdmin !== undefined && { is_admin: pilot.isAdmin }),
    ...(pilot.isHidden !== undefined && { is_hidden: pilot.isHidden })
  };
};

export const safetyReportToDbSafetyReport = (report: Partial<SafetyReport>): Partial<DbSafetyReport> => {
  return {
    ...(report.id && { id: report.id }),
    ...(report.reportDate && { report_date: report.reportDate }),
    ...(report.reporterId && { reporter_id: report.reporterId }),
    ...(report.reporterName && { reported_by: report.reporterName }), // Map reporterName to reported_by
    ...(report.category && { category: report.category }),
    ...(report.description && { description: report.description }),
    ...(report.severity && { severity: report.severity }),
    ...(report.status && { status: report.status }),
    ...(report.actions !== undefined && { actions: report.actions }),
    ...(report.location !== undefined && { location: report.location }),
    ...(report.aircraftId !== undefined && { aircraft_id: report.aircraftId }),
    ...(report.adminReview !== undefined && { admin_review: report.adminReview })
  };
};

export const routeTargetTimeToDbRouteTargetTime = (targetTime: Partial<RouteTargetTime>): Partial<DbRouteTargetTime> => {
  return {
    ...(targetTime.id && { id: targetTime.id }),
    ...(targetTime.route && { route: targetTime.route }),
    ...(targetTime.targetTime !== undefined && { target_time: targetTime.targetTime }),
    ...(targetTime.aircraftId !== undefined && { aircraft_id: targetTime.aircraftId }),
    ...(targetTime.pilotId !== undefined && { pilot_id: targetTime.pilotId }),
    ...(targetTime.year !== undefined && { year: targetTime.year }),
    ...(targetTime.month !== undefined && { month: targetTime.month })
  };
};
