
import { createClient } from '@supabase/supabase-js';
import { MaintenanceType, MaintenanceRecord } from '../types';
import { supabase } from '@/integrations/supabase/client';

// Since the maintenance_types table doesn't exist in the database schema,
// we'll modify these functions to use the maintenance_items table instead

export async function getMaintenanceTypes(): Promise<MaintenanceType[]> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .select('*')
    .order('name');

  if (error) throw error;
  
  // Convert maintenance_items to MaintenanceType format
  return data.map(item => ({
    id: item.id,
    name: item.name,
    interval: item.interval || 0,
    description: item.description,
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
}

export async function createMaintenanceType(maintenanceType: Omit<MaintenanceType, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceType> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .insert({
      name: maintenanceType.name,
      interval: maintenanceType.interval,
      description: maintenanceType.description,
      maintenance_id: null // Required field for the maintenance_items table
    })
    .select()
    .single();

  if (error) throw error;
  
  // Convert to MaintenanceType format
  return {
    id: data.id,
    name: data.name,
    interval: data.interval || 0,
    description: data.description,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function updateMaintenanceType(id: string, maintenanceType: Partial<MaintenanceType>): Promise<MaintenanceType> {
  const { data, error } = await supabase
    .from('maintenance_items')
    .update({
      name: maintenanceType.name,
      interval: maintenanceType.interval,
      description: maintenanceType.description
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  // Convert to MaintenanceType format
  return {
    id: data.id,
    name: data.name,
    interval: data.interval || 0,
    description: data.description,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function deleteMaintenanceType(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Maintenance Records API functions - using the maintenance table instead
export async function getMaintenanceRecords(aircraftId?: string): Promise<MaintenanceRecord[]> {
  let query = supabase
    .from('maintenance')
    .select('*');

  if (aircraftId) {
    query = query.eq('aircraft_id', aircraftId);
  }

  const { data, error } = await query.order('id');

  if (error) throw error;
  
  // Convert to MaintenanceRecord format
  return data.map(item => ({
    id: item.id,
    aircraft_id: item.aircraft_id,
    maintenance_type_id: item.maintenance_type || '',
    last_done: parseFloat(item.last_fifty_hour) || null,
    next_due: parseFloat(item.last_hundred_hour) || 0,
    status: 'pending',
    notes: item.description,
    created_at: item.created_at,
    updated_at: item.updated_at,
    maintenance_type: {
      id: item.id,
      name: item.maintenance_type || 'Unknown',
      interval: 100,
      description: item.description,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  }));
}

export async function createMaintenanceRecord(maintenanceRecord: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceRecord> {
  const { data, error } = await supabase
    .from('maintenance')
    .insert({
      aircraft_id: maintenanceRecord.aircraft_id,
      maintenance_type: maintenanceRecord.maintenance_type_id,
      last_fifty_hour: maintenanceRecord.last_done?.toString(),
      last_hundred_hour: maintenanceRecord.next_due.toString(),
      description: maintenanceRecord.notes
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    aircraft_id: data.aircraft_id,
    maintenance_type_id: data.maintenance_type || '',
    last_done: parseFloat(data.last_fifty_hour) || null,
    next_due: parseFloat(data.last_hundred_hour) || 0,
    status: 'pending',
    notes: data.description,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function updateMaintenanceRecord(id: string, maintenanceRecord: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const updateData: any = {};
  
  if (maintenanceRecord.aircraft_id) updateData.aircraft_id = maintenanceRecord.aircraft_id;
  if (maintenanceRecord.maintenance_type_id) updateData.maintenance_type = maintenanceRecord.maintenance_type_id;
  if (maintenanceRecord.last_done !== undefined) updateData.last_fifty_hour = maintenanceRecord.last_done?.toString();
  if (maintenanceRecord.next_due !== undefined) updateData.last_hundred_hour = maintenanceRecord.next_due.toString();
  if (maintenanceRecord.notes) updateData.description = maintenanceRecord.notes;

  const { data, error } = await supabase
    .from('maintenance')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    aircraft_id: data.aircraft_id,
    maintenance_type_id: data.maintenance_type || '',
    last_done: parseFloat(data.last_fifty_hour) || null,
    next_due: parseFloat(data.last_hundred_hour) || 0,
    status: 'pending',
    notes: data.description,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
