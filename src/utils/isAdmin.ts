import { supabase } from '@/integrations/supabase/client';

export const GENERAL_ADMIN_USER_ID = "d3fedd8c-08e7-428c-8172-70c9d55e6c81";

export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      return false;
    }
    return authData.user.id === GENERAL_ADMIN_USER_ID;
  } catch (error) {
    console.error('Error in checkIsAdmin:', error);
    return false;
  }
}; 