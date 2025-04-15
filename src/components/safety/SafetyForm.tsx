
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ReportBasicInfoForm } from './components/ReportBasicInfoForm';
import { ReportDetailsForm } from './components/ReportDetailsForm';
import { AdminReviewForm } from './components/AdminReviewForm';
import { FormActions } from './components/FormActions';
import { useSafetyForm } from './hooks/useSafetyForm';
import { useAuthContext } from '@/contexts/AuthContext';
import { ExportReportButton } from './components/ExportReportButton';
import { PrintableReportView } from './components/PrintableReportView';
import { SafetyReport } from '@/types';

export function SafetyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, currentUser } = useAuthContext();
  
  const { 
    report, 
    setReport, 
    aircraft,
    isAdmin,
    isSubmitting,
    isLoading,
    error,
    handleInputChange,
    handleSubmit
  } = useSafetyForm({ 
    id,
    currentUser
  });
  
  const isEditMode = id !== 'new';
  const cardTitle = isEditMode ? (isAdmin ? 'Edit Safety Report' : 'View Safety Report') : 'New Safety Report';
  
  // Set view-only mode if it's an existing report and the user is not an admin
  const isViewOnly = isEditMode && !isAdmin;
  
  // If we're loading or have an error
  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle />
            Error Loading Report
          </CardTitle>
          <CardDescription>
            We encountered a problem while loading the safety report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/safety')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Safety Reports
          </Button>
          <Button 
            variant="default" 
            onClick={() => navigate(0)} 
            className="ml-2"
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{cardTitle}</h1>
        <Button variant="outline" onClick={() => navigate('/safety')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
      </div>
      
      {isEditMode && isAdmin && report.id && (
        <div className="mb-6">
          <ExportReportButton report={report as unknown as SafetyReport} />
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              {isViewOnly ? 'View the basic details of this safety report' : 'Enter the basic details about the safety report'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportBasicInfoForm
              reportDate={report.reportDate}
              category={report.category}
              location={report.location || ''}
              severity={report.severity}
              reporterName={report.reporterName || ''}
              aircraftId={report.aircraftId || 'none'}
              aircraft={aircraft}
              isAdmin={isAdmin}
              isViewOnly={isViewOnly}
              onInputChange={handleInputChange}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>
              {isViewOnly ? 'View the detailed information about this safety incident' : 'Provide detailed information about the safety incident'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportDetailsForm
              description={report.description}
              actions={report.actions || ''}
              isViewOnly={isViewOnly}
              onInputChange={handleInputChange}
            />
          </CardContent>
        </Card>
        
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Review</CardTitle>
              <CardDescription>
                Administrative review and status update for this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminReviewForm 
                status={report.status as "submitted" | "under-review" | "resolved" | "closed"}
                adminReview={report.adminReview}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>
        )}
        
        <FormActions 
          isSubmitting={isSubmitting}
          isEditMode={isEditMode}
          isAdmin={isAdmin}
        />
      </form>

      {/* Printable view for the report - hidden until print */}
      {isEditMode && report && <PrintableReportView report={report as unknown as SafetyReport} />}
    </>
  );
}
