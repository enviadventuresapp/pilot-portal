
import { Aircraft } from '@/types';
import { ensureNumber } from './numberUtils';

/**
 * Makes sure an Aircraft object has all required properties for the database
 * and UI interactions
 * 
 * @param aircraft Partial Aircraft object
 * @returns Completed Aircraft object with all required fields
 */
export function normalizeAircraft(aircraft: Partial<Aircraft>): Aircraft {
  const normalizedAircraft: Aircraft = {
    id: aircraft.id || '',
    tail_number: aircraft.tail_number || aircraft.tailNumber || '',
    tailNumber: aircraft.tailNumber || aircraft.tail_number || '',
    type: aircraft.type || aircraft.make || 'unknown',
    make: aircraft.make || '',
    model: aircraft.model || '',
    year: aircraft.year || '',
    created_at: aircraft.created_at || aircraft.createdAt || '',
    updated_at: aircraft.updated_at || aircraft.updatedAt || '',
    createdAt: aircraft.createdAt || aircraft.created_at || '',
    updatedAt: aircraft.updatedAt || aircraft.updated_at || '',
    registration: aircraft.registration || '',
    category: aircraft.category || '',
    tachTime: ensureNumber(aircraft.tachTime),
    oilChange: aircraft.oilChange || null,
    lastAnnual: aircraft.lastAnnual || null,
    ownership: aircraft.ownership || '',
    imageUrl: aircraft.imageUrl || '',
    lastFlight: aircraft.lastFlight || null,
  };
  
  return normalizedAircraft;
}

/**
 * Converts an array of partial Aircraft objects to fully normalized Aircraft objects
 * 
 * @param aircraftArray Array of partial Aircraft objects
 * @returns Array of normalized Aircraft objects
 */
export function normalizeAircraftArray(aircraftArray: Partial<Aircraft>[]): Aircraft[] {
  return aircraftArray.map(aircraft => normalizeAircraft(aircraft));
}

/**
 * Create a basic empty Aircraft object for new aircraft creation
 */
export function createEmptyAircraft(): Aircraft {
  return {
    id: '',
    tail_number: '',
    tailNumber: '',
    type: 'unknown',
    make: '',
    model: '',
    year: '',
    created_at: '',
    updated_at: '',
    registration: '',
  };
}
