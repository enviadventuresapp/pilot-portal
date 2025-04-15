
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Aircraft, PilotRecord, SafetyReport } from '@/types';
import { useAuthContext } from '@/contexts/AuthContext';
import { getAllAircraft } from '@/services/aircraftService';
import { getSafetyReportById, createSafetyReport, updateSafetyReport } from '@/services/safetyService';

interface FormData {
  id?: string;
  reporterId?: string;
  reportDate: string;
  category: string;
  description: string;
  severity: string;
  location: string;
  aircraftId?: string;
  actions: string;
  status: "submitted" | "under-review" | "resolved" | "closed";
  reporterName?: string;
  adminReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    notes?: string;
  };
}

interface UseSafetyFormProps {
  id?: string;
  currentUser: PilotRecord | null;
}

export const useSafetyForm = ({ id, currentUser }: UseSafetyFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FormData>({
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    description: '',
    severity: 'medium',
    location: '',
    aircraftId: 'none',
    actions: '',
    reporterName: currentUser?.name || '',
    status: 'submitted'
  });
  
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const isAdmin = currentUser?.isAdmin || false;
  
  // Fetch aircraft data
  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        console.log("Fetching aircraft data...");
        const { success, aircraft: aircraftData, error } = await getAllAircraft();
        
        if (error) {
          console.error('Error fetching aircraft:', error);
          toast({
            title: "Error",
            description: "Failed to load aircraft data.",
            variant: "destructive"
          });
          return;
        }
        
        if (success && aircraftData) {
          console.log("Successfully fetched aircraft:", aircraftData);
          setAircraft(aircraftData);
        }
      } catch (error) {
        console.error('Exception fetching aircraft:', error);
        toast({
          title: "Error",
          description: "Failed to load aircraft data.",
          variant: "destructive"
        });
      }
    };
    
    fetchAircraft();
  }, [toast]);
  
  // Fetch report if editing
  useEffect(() => {
    if (id && id !== 'new') {
      const fetchReport = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          console.log(`Fetching safety report with ID: ${id}`);
          const { success, report: fetchedReport, error } = await getSafetyReportById(id);
          
          if (error) {
            console.error('Error fetching report:', error);
            setError(error);
            toast({
              title: 'Error',
              description: error || 'Failed to load report data',
              variant: 'destructive'
            });
            return;
          }
          
          if (success && fetchedReport) {
            console.log('Fetched report:', fetchedReport);
            setReport({
              id: fetchedReport.id,
              reporterId: fetchedReport.reporterId,
              reportDate: fetchedReport.reportDate || format(new Date(), 'yyyy-MM-dd'),
              category: fetchedReport.category || '',
              description: fetchedReport.description || '',
              severity: fetchedReport.severity || 'medium',
              location: fetchedReport.location || '',
              aircraftId: fetchedReport.aircraftId || 'none',
              actions: fetchedReport.actions || '',
              status: (fetchedReport.status as "submitted" | "under-review" | "resolved" | "closed") || 'submitted',
              reporterName: fetchedReport.reporterName || '',
              adminReview: fetchedReport.adminReview || undefined
            });
          }
        } catch (error) {
          console.error('Error fetching report:', error);
          setError('Failed to load report data');
          toast({
            title: 'Error',
            description: 'Failed to load report data.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchReport();
    }
  }, [id, navigate, toast]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { name: string; value: any }) => {
    const name = 'target' in e ? e.target.name : e.name;
    const value = 'target' in e ? e.target.value : e.value;
    
    setReport(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log("Submitting report with data:", report);
    
    if (!report.category || !report.description || !report.severity || !report.reportDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (id === 'new') {
        // Create new report using our edge function
        const { success, report: newReport, error } = await createSafetyReport({
          reportDate: report.reportDate,
          reporterName: report.reporterName,
          category: report.category,
          description: report.description,
          severity: report.severity,
          location: report.location || '',
          aircraftId: report.aircraftId && report.aircraftId !== 'none' ? report.aircraftId : undefined,
          actions: report.actions || '',
          status: report.status
        });
        
        if (error) {
          throw new Error(error);
        }
        
        if (success) {
          toast({
            title: "Report Submitted",
            description: "Your safety report has been submitted successfully."
          });
          
          navigate('/safety');
        }
      } else {
        // Update existing report
        const { success, error } = await updateSafetyReport(id, {
          id: report.id,
          reporterId: report.reporterId,
          reportDate: report.reportDate,
          reporterName: report.reporterName,
          category: report.category,
          description: report.description,
          severity: report.severity,
          location: report.location || '',
          aircraftId: report.aircraftId && report.aircraftId !== 'none' ? report.aircraftId : undefined,
          actions: report.actions || '',
          status: report.status,
          adminReview: isAdmin ? {
            reviewedBy: currentUser?.name,
            reviewedAt: new Date().toISOString(),
            notes: report.adminReview?.notes || ''
          } : undefined
        });
        
        if (error) {
          throw new Error(error);
        }
        
        if (success) {
          toast({
            title: "Report Updated",
            description: "The safety report has been updated successfully."
          });
          
          navigate('/safety');
        }
      }
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    report,
    setReport,
    aircraft,
    isAdmin,
    isSubmitting,
    isLoading,
    error,
    handleInputChange,
    handleSubmit
  };
};
