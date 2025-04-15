
import { Json } from '@/integrations/supabase/types';

export const getSeverityColor = (severity: string) => {
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

export const parseAdminReviewData = (adminReview: Json | null) => {
  if (!adminReview) return null;
  
  try {
    const adminReviewObj = typeof adminReview === 'string' 
      ? JSON.parse(adminReview) 
      : adminReview;
      
    return {
      reviewedBy: safeJsonAccess(adminReviewObj, 'reviewed_by', ''),
      reviewedAt: safeJsonAccess(adminReviewObj, 'reviewed_at', ''),
      notes: safeJsonAccess(adminReviewObj, 'notes', '')
    };
  } catch (error) {
    console.error('Error parsing admin review data:', error);
    return null;
  }
};

export const safeJsonAccess = (obj: any, key: string, defaultValue: string) => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  return obj[key] || defaultValue;
};

export const extractLocationFromData = (data: any): string => {
  return 'location' in data ? String(data.location || '') : '';
};

export const extractAircraftIdFromData = (data: any): string => {
  let aircraftId = '';
  
  if ('aircraft_id' in data) {
    aircraftId = String(data.aircraft_id || '');
  } else if (data.aircraft && typeof data.aircraft === 'object') {
    // Add null check for data.aircraft before accessing its properties
    if ('id' in data.aircraft && data.aircraft.id !== null) {
      aircraftId = String(data.aircraft.id || '');
    }
  }
  
  return aircraftId;
};
