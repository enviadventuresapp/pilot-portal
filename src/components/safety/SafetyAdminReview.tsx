import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SafetyReport, PilotRecord } from '@/types';
import { format } from 'date-fns';
import { Search, AlertTriangle, Filter, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function SafetyAdminReview() {
  const navigate = useNavigate();
  const [safetyReports] = useLocalStorage<SafetyReport[]>('safetyReports', []);
  const [currentUser] = useLocalStorage<PilotRecord | null>('currentUser', null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  if (!currentUser?.isAdmin) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-medium mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground mb-4">
          You need administrator privileges to access this page.
        </p>
        <button 
          onClick={() => navigate('/safety')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Safety</span>
        </button>
      </div>
    );
  }
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };
  
  const filteredReports = safetyReports
    .filter(report => {
      const searchMatch = 
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const statusMatch = statusFilter === 'all' || report.status === statusFilter;
      const severityMatch = severityFilter === 'all' || report.severity === severityFilter;
      
      return searchMatch && statusMatch && severityMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(b.reportDate || '').getTime() - 
                      new Date(a.reportDate || '').getTime();
          break;
        case 'severity':
          const severityOrder: Record<string, number> = { 
            'critical': 4, 'high': 3, 'medium': 2, 'low': 1, '': 0 
          };
          comparison = severityOrder[b.severity || ''] - severityOrder[a.severity || ''];
          break;
        case 'status':
          const statusOrder: Record<string, number> = { 
            'submitted': 4, 'under-review': 3, 'resolved': 2, 'closed': 1, '': 0 
          };
          comparison = statusOrder[b.status || ''] - statusOrder[a.status || ''];
          break;
        case 'reportedBy':
          comparison = (a.reporterName || '').localeCompare(b.reporterName || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison * -1 : comparison;
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
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Safety Reports Administration</h1>
        <button 
          onClick={() => navigate('/safety')}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-input rounded-md hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Safety</span>
        </button>
      </div>
      
      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
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
            
            <div className="flex gap-2">
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
              
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-md border"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer w-[150px]"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    {getSortIcon('date')}
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('severity')}
                >
                  <div className="flex items-center gap-1">
                    <span>Severity</span>
                    {getSortIcon('severity')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('reportedBy')}
                >
                  <div className="flex items-center gap-1">
                    <span>Reported By</span>
                    {getSortIcon('reportedBy')}
                  </div>
                </TableHead>
                <TableHead className="w-[300px]">Description</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No safety reports found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell>
                      {format(
                        new Date(report.reportDate || new Date()), 
                        'MMM d, yyyy'
                      )}
                    </TableCell>
                    <TableCell>
                      {report.category ? (
                        <Badge variant="outline" className="capitalize">
                          {report.category}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${getSeverityColor(report.severity || '')}`}>
                        {report.severity || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.reporterName || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="line-clamp-2 text-sm">
                        {report.description || 'No description provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${getStatusColor(report.status || '')}`}>
                        {report.status || 'Submitted'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => navigate(`/safety/${report.id}`)}
                        className="inline-block px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Review
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
