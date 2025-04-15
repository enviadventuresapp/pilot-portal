
import React from 'react';
import { SafetyReport } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface PrintableReportViewProps {
  report: SafetyReport;
}

export const PrintableReportView: React.FC<PrintableReportViewProps> = ({ report }) => {
  // Only show in print mode
  return (
    <div className="hidden print:block p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Safety Report</h1>
        <p className="text-gray-600">FAA Compliant Safety Report</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="font-bold">Report ID:</p>
          <p>{report.id}</p>
        </div>
        <div>
          <p className="font-bold">Report Date:</p>
          <p>{format(new Date(report.reportDate || new Date()), 'MMMM d, yyyy')}</p>
        </div>
        <div>
          <p className="font-bold">Reporter:</p>
          <p>{report.reporterName || 'Anonymous'}</p>
        </div>
        <div>
          <p className="font-bold">Category:</p>
          <p className="capitalize">{report.category}</p>
        </div>
        <div>
          <p className="font-bold">Severity:</p>
          <p className="capitalize">{report.severity}</p>
        </div>
        <div>
          <p className="font-bold">Status:</p>
          <p className="capitalize">{report.status || 'submitted'}</p>
        </div>
        {report.location && (
          <div>
            <p className="font-bold">Location:</p>
            <p>{report.location}</p>
          </div>
        )}
        {report.aircraftId && report.aircraftId !== 'none' && (
          <div>
            <p className="font-bold">Aircraft:</p>
            <p>{report.aircraftId}</p>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <p className="font-bold">Description:</p>
        <p className="border p-3 rounded whitespace-pre-wrap">{report.description}</p>
      </div>
      
      {report.actions && (
        <div className="mb-6">
          <p className="font-bold">Actions Taken:</p>
          <p className="border p-3 rounded whitespace-pre-wrap">{report.actions}</p>
        </div>
      )}
      
      {report.adminReview && (
        <div className="mb-6">
          <p className="font-bold">Admin Review:</p>
          <div className="border p-3 rounded">
            {report.adminReview.notes && (
              <p className="whitespace-pre-wrap">{report.adminReview.notes}</p>
            )}
            <p className="mt-2 text-sm">
              {report.adminReview.reviewedAt && (
                <>Reviewed on {format(new Date(report.adminReview.reviewedAt), 'MMMM d, yyyy')} </>
              )}
              {report.adminReview.reviewedBy && (
                <>by {report.adminReview.reviewedBy}</>
              )}
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-8 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold">Admin Signature:</p>
            <div className="h-16 border-b mt-8"></div>
          </div>
          <div>
            <p className="font-bold">Date:</p>
            <div className="h-16 border-b mt-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
