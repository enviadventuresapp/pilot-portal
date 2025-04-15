
-- Create a function that can insert a pilot safely without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.create_pilot_safely(
  pilot_name TEXT,
  pilot_email TEXT,
  pilot_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_pilot_id UUID;
BEGIN
  -- Insert the new pilot and return the ID
  INSERT INTO public.pilots (name, email, user_id, is_admin, is_hidden)
  VALUES (pilot_name, pilot_email, pilot_user_id, false, false)
  RETURNING id INTO new_pilot_id;
  
  RETURN new_pilot_id;
END;
$$;
