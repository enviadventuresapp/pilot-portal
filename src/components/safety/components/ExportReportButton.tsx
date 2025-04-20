
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SafetyReport } from '@/types';
import { format } from 'date-fns';
import { Printer, FileText, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExportReportButtonProps {
  report: SafetyReport;
}

export const ExportReportButton: React.FC<ExportReportButtonProps> = ({ report }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const handlePrint = () => {
    window.print();
  };
  
  // const exportToPDF = () => {
  //   setIsExporting(true);
    
  //   // In a real implementation, we would use a PDF library like jsPDF or pdfmake
  //   // For this example, we'll just simulate the export with a delay
  //   setTimeout(() => {
  //     toast({
  //       title: "Export successful",
  //       description: "Safety report exported to PDF format"
  //     });
  //     setIsExporting(false);
  //   }, 1000);
  // };
  
  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Convert report data to CSV format
      const csvData = [
        ['Report ID', 'Date', 'Reporter', 'Category', 'Severity', 'Status', 'Description', 'Actions', 'Location', 'Admin Review'],
        [
          report.id,
          report.reportDate,
          report.reporterName || 'Anonymous',
          report.category,
          report.severity,
          report.status,
          report.description,
          report.actions || '',
          report.location || '',
          report.adminReview?.notes || ''
        ]
      ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `safety-report-${report.id}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Safety report exported to CSV format"
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Export failed",
        description: "Failed to export safety report",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="print:hidden space-y-2">
      <h3 className="font-medium text-sm">Export Options:</h3>
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={handlePrint}
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
        >
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </Button>
        {/* <Button
          onClick={exportToPDF}
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
          disabled={isExporting}
        >
          <FileText className="h-4 w-4" />
          <span>Export PDF</span>
        </Button> */}
        <Button
          onClick={exportToCSV}
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
          disabled={isExporting}
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>
    </div>
  );
};
