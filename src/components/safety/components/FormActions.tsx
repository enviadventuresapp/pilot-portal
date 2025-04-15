
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  isEditMode?: boolean;
  isAdmin?: boolean;
  onCancel?: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  isSubmitting,
  isEditMode,
  isAdmin = false,
  onCancel
}) => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/safety');
    }
  };
  
  // If it's edit mode and user is not admin, don't show edit actions
  if (isEditMode && !isAdmin) {
    return (
      <div className="flex items-center justify-end gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
        >
          Back to Reports
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-end gap-3 pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        className="flex items-center gap-1.5"
      >
        <X className="w-4 h-4" />
        <span>Cancel</span>
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-1.5"
      >
        <Check className="w-4 h-4" />
        <span>{isSubmitting ? 'Saving...' : 'Save Report'}</span>
      </Button>
    </div>
  );
};
