
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReportDetailsFormProps {
  description: string;
  actions: string;
  isViewOnly?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { name: string; value: any }) => void;
}

export const ReportDetailsForm: React.FC<ReportDetailsFormProps> = ({
  description,
  actions,
  isViewOnly = false,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Provide a detailed description of the safety incident"
          value={description}
          onChange={onInputChange}
          rows={6}
          disabled={isViewOnly}
        />
      </div>
      
      {/* Only show actions field for admins or when creating new reports */}
      {!isViewOnly && (
        <div>
          <Label htmlFor="actions">Actions Taken</Label>
          <Textarea
            id="actions"
            name="actions"
            placeholder="What actions were taken to address this safety concern?"
            value={actions}
            onChange={onInputChange}
            rows={4}
          />
        </div>
      )}
    </div>
  );
};
