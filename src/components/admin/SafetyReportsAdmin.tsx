import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { getAllSafetyReports, updateSafetyReport } from '@/services/safetyService';
import { SafetyReport } from '@/types';
import { format } from 'date-fns';
import { AlertCircle, Search, Filter, FileText, Printer } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

export function SafetyReportsAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching safety reports for admin dashboard...");
        const result = await getAllSafetyReports();
        
        if (!result.success) {
          console.error('Error fetching safety reports:', result.error);
          setError('Failed to load safety reports. Please try again.');
          return;
        }
        
        console.log("Received safety reports:", result.reports);
        setReports(result.reports || []);
      } catch (err) {
        console.error('Exception fetching safety reports:', err);
        setError('Failed to load safety reports. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) => {
    const searchMatch = 
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const statusMatch = statusFilter === 'all' || report.status === statusFilter;
    
    return searchMatch && statusMatch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under-review':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleRefresh = () => {
    setReports([]);
    setIsLoading(true);
    setError(null);
    
    getAllSafetyReports()
      .then(result => {
        if (result.success) {
          setReports(result.reports || []);
        } else {
          setError('Failed to load safety reports. Please try again.');
        }
      })
      .catch(err => {
        console.error('Error refreshing reports:', err);
        setError('Failed to load safety reports. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Safety Reports</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .report { margin-bottom: 20px; border: 1px solid #ccc; padding: 15px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .page-break { page-break-after: always; }
          </style>
        </head>
        <body>
          <h1>Safety Reports</h1>
          <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reporter</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReports.map(report => `
                <tr>
                  <td>${format(new Date(report.reportDate || new Date()), 'MMM d, yyyy')}</td>
                  <td>${report.reporterName || 'Anonymous'}</td>
                  <td>${report.category || ''}</td>
                  <td>${report.severity || ''}</td>
                  <td>${report.status || ''}</td>
                  <td>${report.description || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const exportAllToCSV = () => {
    try {
      const headers = ['Report ID', 'Date', 'Reporter', 'Category', 'Severity', 'Status', 'Description', 'Actions', 'Location'];
      
      const csvContent = [
        headers.join(','),
        ...filteredReports.map(report => [
          report.id,
          report.reportDate,
          report.reporterName || 'Anonymous',
          report.category,
          report.severity,
          report.status,
          `"${report.description?.replace(/"/g, '""') || ''}"`,
          `"${report.actions?.replace(/"/g, '""') || ''}"`,
          report.location || ''
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `safety-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: `Exported ${filteredReports.length} safety reports to CSV`
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Export failed",
        description: "Failed to export safety reports to CSV",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      const reportToUpdate = reports.find(r => r.id === reportId);
      if (!reportToUpdate) {
        console.error('Report not found:', reportId);
        return;
      }
      
      const { success, error } = await updateSafetyReport(reportId, {
        ...reportToUpdate,
        status: newStatus as "submitted" | "under-review" | "resolved" | "closed",
        adminReview: {
          reviewedBy: currentUser?.name || 'Admin',
          reviewedAt: new Date().toISOString(),
          notes: reportToUpdate.adminReview?.notes || ''
        }
      });
      
      if (success) {
        toast({
          title: "Status Updated",
          description: `Report status changed to ${newStatus}`
        });
        handleRefresh();
      } else if (error) {
        toast({
          title: "Update Failed",
          description: error,
          variant: "destructive"
        });
      }
      
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-destructive/10 p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-medium mb-2">Error loading reports</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold">Safety Reports</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md border"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-md border"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportAllToCSV}>
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrintAll}>
              <Printer className="mr-2 h-4 w-4" />
              Print All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>
      
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-xl">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No safety reports found</h3>
          <p className="text-muted-foreground">No safety reports match your current filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead className="max-w-[300px]">Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    {report.reportDate ? format(new Date(report.reportDate), 'MMM d, yyyy') : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {report.category || 'General'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${getSeverityColor(report.severity || '')}`}>
                      {report.severity || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.reporterName || 'Anonymous'}
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate">
                      {report.description || 'No description provided'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={report.status || 'submitted'} 
                      onValueChange={(value) => handleStatusChange(report.id, value)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <div className="flex items-center gap-2">
                          <Badge className={`capitalize ${getStatusColor(report.status || 'submitted')}`}>
                            {report.status || 'Submitted'}
                          </Badge>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under-review">Under Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/safety/${report.id}`)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
