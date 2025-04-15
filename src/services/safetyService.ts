
import { supabase } from '@/integrations/supabase/client';
import { SafetyReport } from '@/types';
import { dbSafetyReportToSafetyReport, safetyReportToDbSafetyReport } from '@/utils/dbModelConverters';
import { Tables } from '@/types/supabase';

// Define a type for the safety_reports table that matches our actual database schema
type DbSafetyReport = Tables<'safety_reports'>;

export const getAllSafetyReports = async () => {
  try {
    console.log("Calling getAllSafetyReports service function");
    
    // Call the Edge Function to avoid RLS recursion issues
    const { data, error } = await supabase.functions.invoke('get_all_safety_reports');

    if (error) {
      console.error('Error fetching safety reports from edge function:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('No data returned from safety reports edge function');
      return { success: false, error: 'No data returned from server' };
    }
    
    console.log("Raw safety reports data:", data);
    
    // Map DB records to app model with proper type handling
    const reports = Array.isArray(data) ? data.map((report) => {
      try {
        return dbSafetyReportToSafetyReport(report as DbSafetyReport);
      } catch (err) {
        console.error('Error converting report:', report, err);
        return null;
      }
    }).filter(Boolean) as SafetyReport[] : [];
    
    console.log("Converted safety reports:", reports);
    
    return { success: true, reports };
  } catch (error) {
    console.error('Error in getAllSafetyReports:', error);
    return { success: false, error: String(error) };
  }
};

export const getSafetyReportById = async (reportId: string) => {
  try {
    console.log(`Fetching safety report with ID: ${reportId}`);
    
    // Call the Edge Function to avoid RLS recursion issues
    const { data, error } = await supabase.functions.invoke('get_safety_report_by_id', {
      body: { id: reportId }
    });

    if (error) {
      console.error('Error invoking get_safety_report_by_id edge function:', error);
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      console.error('Error from edge function:', data?.error || 'Unknown error');
      return { success: false, error: data?.error || 'Failed to load report data' };
    }
    
    console.log("Raw safety report data:", data.report);
    
    // Convert to app model with proper type casting
    const report = dbSafetyReportToSafetyReport(data.report as DbSafetyReport);
    
    return { success: true, report };
  } catch (error) {
    console.error('Error in getSafetyReportById:', error);
    return { success: false, error: String(error) };
  }
};

export const createSafetyReport = async (report: Partial<SafetyReport>) => {
  try {
    console.log("Creating safety report with data:", report);
    
    // Ensure required fields are present
    if (!report.reportDate || !report.category || !report.severity || !report.description) {
      return {
        success: false,
        error: 'Missing required fields for safety report'
      };
    }

    // Use the edge function to avoid RLS recursion issues
    const { data, error } = await supabase.functions.invoke('create_safety_report', {
      body: {
        reportDate: report.reportDate,
        reporterName: report.reporterName || 'Anonymous',
        category: report.category,
        description: report.description,
        severity: report.severity,
        status: report.status || 'submitted',
        actions: report.actions,
        location: report.location,
        aircraftId: report.aircraftId
      }
    });

    if (error) {
      console.error('Error invoking create_safety_report edge function:', error);
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      console.error('Error from edge function:', data?.error || 'Unknown error');
      return { success: false, error: data?.error || 'Failed to create safety report' };
    }
    
    // Convert returned data to app model
    const createdReport = dbSafetyReportToSafetyReport(data.data as DbSafetyReport);
    
    return { success: true, report: createdReport };
  } catch (error) {
    console.error('Error in createSafetyReport:', error);
    return { success: false, error: String(error) };
  }
};

export const updateSafetyReport = async (reportId: string, report: Partial<SafetyReport>) => {
  try {
    console.log(`Updating safety report with ID: ${reportId}`, report);
    
    // Use the edge function to avoid RLS recursion issues
    const { data, error } = await supabase.functions.invoke('update_safety_report', {
      body: {
        id: reportId,
        reportData: {
          reportDate: report.reportDate,
          reporterName: report.reporterName,
          category: report.category,
          description: report.description,
          severity: report.severity,
          status: report.status || 'submitted',
          actions: report.actions,
          location: report.location,
          aircraftId: report.aircraftId,
          adminReview: report.adminReview
        }
      }
    });

    if (error) {
      console.error('Error invoking update_safety_report edge function:', error);
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      console.error('Error from edge function:', data?.error || 'Unknown error');
      return { success: false, error: data?.error || 'Failed to update safety report' };
    }
    
    // Convert returned data to app model
    const updatedReport = dbSafetyReportToSafetyReport(data.report as DbSafetyReport);
    
    return { success: true, report: updatedReport };
  } catch (error) {
    console.error('Error in updateSafetyReport:', error);
    return { success: false, error: String(error) };
  }
};

export const deleteSafetyReport = async (reportId: string) => {
  try {
    const { error } = await supabase
      .from('safety_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting safety report:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteSafetyReport:', error);
    return { success: false, error: String(error) };
  }
};
