import { useEffect, useState } from 'react';
import { getAllSafetyReports, deleteSafetyReport } from '@/services/safetyService';
import { SafetyReport } from '@/types';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'under-review':
      return 'bg-purple-100 text-purple-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const SafetyList = () => {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userHasSubmitted, setUserHasSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, user } = useAuthContext();

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    } else {
      // Just check if the current user has submitted a report already
      checkUserSubmission();
    }
  }, [isAdmin, user?.id]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching safety reports...");
      const { success, reports: fetchedReports, error } = await getAllSafetyReports();

      if (success && fetchedReports) {
        console.log("Fetched reports:", fetchedReports);
        setReports(fetchedReports);

        // Check if the non-admin user has submitted a report
        if (!isAdmin && user?.id) {
          const hasSubmitted = fetchedReports.some(report => report.reporterId === user.id);
          setUserHasSubmitted(hasSubmitted);
        }
      } else if (error) {
        console.error("Error fetching reports:", error);
        setError(error);
        toast({
          title: "Error loading reports",
          description: error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching safety reports:', error);
      setError('Failed to load report data.');
      toast({
        title: "Error",
        description: "Failed to load safety reports",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  const checkUserSubmission = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        setUserHasSubmitted(false);
        return;
      }

      const { success, reports: fetchedReports } = await getAllSafetyReports();
      if (success && fetchedReports) {
        const hasSubmitted = fetchedReports.some(report => report.reporterId === user.id);
        setUserHasSubmitted(hasSubmitted);
      }
    } catch (error) {
      console.error('Error checking user submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    navigate('/safety/new');
  };

  const handleAdminReview = () => {
    navigate('/admin/safety');
  };

  const handleViewReport = (reportId: string) => {
    if (!isAdmin) return;
    navigate(`/safety/${reportId}`);
  };


  const handleEditReport = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    navigate(`/safety/${reportId}/edit`);
  };

  const handleDeleteReport = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setReportToDelete(reportId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;

    try {
      setDeleteLoading(true);
      const { success, error } = await deleteSafetyReport(reportToDelete);

      if (success) {
        // Remove from local state
        setReports(reports.filter(report => report.id !== reportToDelete));
        toast({
          title: "Success",
          description: "Safety report deleted successfully",
        });
      } else {
        console.error("Error deleting report:", error);
        toast({
          title: "Error",
          description: "Failed to delete safety report",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting safety report:', error);
      toast({
        title: "Error",
        description: "Failed to delete safety report",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const filteredReports = reports.filter(report =>
    report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error && !loading && isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Safety Management System</h1>
          <div className="flex gap-2">
            <Button onClick={handleAddNew}>
              New Report
            </Button>
          </div>
        </div>

        <div className="bg-red-500 text-white p-6 rounded-md shadow">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-medium">Error</h3>
              <p>Failed to load report data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For regular users, show a simplified view
  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Safety Management System</h1>
          <div className="flex gap-2">
            <Button
              onClick={handleAddNew}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={userHasSubmitted}
            >
              <Plus className="h-4 w-4 mr-2" /> Submit Report
            </Button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden p-6">
          {loading ? (
            <div className="flex justify-center p-6">
              <Skeleton className="h-16 w-full max-w-lg" />
            </div>
          ) : userHasSubmitted ? (
            <div className="text-center p-6 bg-green-50 border border-green-100 rounded-lg">
              <h3 className="text-lg font-medium text-green-800">Thank you for your submission</h3>
              <p className="mt-2 text-green-600">
                You have already submitted a safety report. Our safety team will review it and may contact you for additional information.
              </p>
            </div>
          ) : (
            <div className="text-center p-6">
              <h3 className="text-lg font-medium">Safety Reporting</h3>
              <p className="mt-2 text-gray-600">
                Use this system to report any safety concerns. Your reports are confidential and will be reviewed by our safety team.
              </p>
              <p className="mt-4 text-gray-600">
                Click the "Submit Report" button above to create a new safety report.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin view with full capabilities
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Safety Management System</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAdminReview}>
            Admin Dashboard
          </Button>
          <Button onClick={handleAddNew} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-2" /> New Report
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2"
          />
        </div>
        <Button variant="ghost" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="animate-fade-in">
            <div className="px-6 py-3 bg-gray-50">
              <div className="grid grid-cols-5 gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="grid grid-cols-5 gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <div className="flex justify-end">
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    No safety reports yet
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewReport(report.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.reportDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={(e) => handleEditReport(e, report.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={(e) => handleDeleteReport(e, report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the safety report from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};