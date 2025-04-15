
import { Database } from '@/integrations/supabase/types';

// Export types from the generated Supabase types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Custom type definitions for our application
export type SafetyReportStatus = 'submitted' | 'under-review' | 'resolved' | 'closed';
export type SafetyReportType = 'hazard' | 'incident' | 'accident' | 'suggestion';
export type SafetyReportSeverity = 'low' | 'medium' | 'high' | 'critical';
