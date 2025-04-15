
import React, { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface AdminReviewProps {
  status: "submitted" | "under-review" | "resolved" | "closed";
  adminReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    notes?: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { name: string; value: any }) => void;
}

export const AdminReviewForm: React.FC<AdminReviewProps> = ({
  status,
  adminReview,
  onInputChange
}) => {
  const handleStatusChange = useCallback((value: string) => {
    onInputChange({
      name: 'status',
      value
    });
  }, [onInputChange]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const notes = e.target.value;
    onInputChange({
      name: 'adminReview',
      value: {
        ...adminReview,
        notes,
        reviewedBy: adminReview?.reviewedBy || 'Admin',
        reviewedAt: adminReview?.reviewedAt || new Date().toISOString()
      }
    });
  }, [adminReview, onInputChange]);

  return (
    <div className="border p-4 rounded-md bg-muted/20">
      <h3 className="text-lg font-medium mb-4">Admin Review</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={status} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under-review">Under Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="adminNotes">Admin Notes</Label>
          <Textarea
            id="adminNotes"
            placeholder="Add notes about this report"
            value={adminReview?.notes || ''}
            onChange={handleNotesChange}
            rows={3}
          />
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground">
            {adminReview?.reviewedAt ? (
              <span>Reviewed on {format(new Date(adminReview.reviewedAt), 'MMM d, yyyy')}</span>
            ) : (
              <span>Not yet reviewed</span>
            )}
            {adminReview?.reviewedBy && (
              <span> by {adminReview.reviewedBy}</span>
            )}
          </Label>
        </div>
      </div>
    </div>
  );
};
