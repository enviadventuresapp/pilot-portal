
import React, { useCallback } from 'react';
import { format } from 'date-fns';
import { Aircraft } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportBasicInfoFormProps {
  reportDate: string;
  category: string;
  severity: string;
  location: string;
  reporterName: string;
  aircraftId: string;
  aircraft: Aircraft[];
  isAdmin: boolean;
  isViewOnly?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { name: string; value: any }) => void;
}

export const ReportBasicInfoForm: React.FC<ReportBasicInfoFormProps> = ({
  reportDate,
  category,
  severity,
  location,
  reporterName,
  aircraftId,
  aircraft,
  isAdmin,
  isViewOnly = false,
  onInputChange
}) => {
  const categories = ['Operational', 'Aircraft', 'Organizational', 'Environmental', 'Human Factors', 'Other'];
  
  // Create wrapper functions using useCallback to prevent re-creation on every render
  const handleCategoryChange = useCallback((value: string) => {
    onInputChange({
      name: 'category', 
      value
    });
  }, [onInputChange]);
  
  const handleSeverityChange = useCallback((value: string) => {
    onInputChange({
      name: 'severity', 
      value
    });
  }, [onInputChange]);
  
  const handleAircraftChange = useCallback((value: string) => {
    onInputChange({
      name: 'aircraftId', 
      value
    });
  }, [onInputChange]);
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="reportDate">Report Date</Label>
        <Input
          type="date"
          id="reportDate"
          name="reportDate"
          value={reportDate}
          onChange={onInputChange}
          max={format(new Date(), 'yyyy-MM-dd')}
          disabled={isViewOnly}
        />
      </div>
      
      <div>
        <Label htmlFor="reporterName">Reporter Name</Label>
        <Input
          type="text"
          id="reporterName"
          name="reporterName"
          placeholder="Enter your name"
          value={reporterName}
          onChange={onInputChange}
        />
      </div>
      
      <div>
        <Label htmlFor="category">Category</Label>
        {isViewOnly ? (
          <Input
            type="text"
            id="category"
            value={category}
            disabled
          />
        ) : (
          <Select 
            value={category} 
            onValueChange={handleCategoryChange}
            disabled={isViewOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div>
        <Label htmlFor="severity">Severity</Label>
        {isViewOnly ? (
          <Input
            type="text"
            id="severity"
            value={severity}
            disabled
          />
        ) : (
          <Select 
            value={severity} 
            onValueChange={handleSeverityChange}
            disabled={isViewOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          type="text"
          id="location"
          name="location"
          placeholder="Enter location"
          value={location}
          onChange={onInputChange}
          disabled={isViewOnly}
        />
      </div>

      <div>
        <Label htmlFor="aircraftId">Aircraft</Label>
        {isViewOnly ? (
          <Input
            type="text"
            id="aircraftId"
            value={aircraftId === 'none' ? 'None' : aircraft.find(ac => ac.id === aircraftId)?.tailNumber || 'Unknown'}
            disabled
          />
        ) : (
          <Select 
            value={aircraftId} 
            onValueChange={handleAircraftChange}
            disabled={isViewOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select aircraft" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {aircraft && aircraft.length > 0 ? aircraft.map((ac) => (
                <SelectItem key={ac.id} value={ac.id}>
                  {ac.tailNumber}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
