
-- Create function to check if RPC functions exist
CREATE OR REPLACE FUNCTION public.check_rpc_functions_exist()
RETURNS boolean AS $$
BEGIN
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to fix admin access
CREATE OR REPLACE FUNCTION public.fix_admin_access(p_email TEXT, p_user_id UUID)
RETURNS boolean AS $$
DECLARE
  v_pilot_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Check if pilot exists with this email
  SELECT id, TRUE INTO v_pilot_id, v_exists
  FROM public.pilots 
  WHERE email = p_email
  LIMIT 1;
  
  IF v_exists THEN
    -- Update existing pilot
    UPDATE public.pilots
    SET is_admin = TRUE, 
        user_id = p_user_id
    WHERE id = v_pilot_id;
  ELSE
    -- Create new pilot with admin privileges
    INSERT INTO public.pilots (
      name, 
      email,
      is_admin,
      is_hidden,
      user_id
    ) VALUES (
      split_part(p_email, '@', 1),
      p_email,
      TRUE,
      FALSE,
      p_user_id
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.check_user_admin_status(p_user_id UUID, p_email TEXT)
RETURNS boolean AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_pilot_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Check if pilot exists with this user_id
  SELECT id, is_admin, TRUE INTO v_pilot_id, v_is_admin, v_exists
  FROM public.pilots 
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF v_exists THEN
    RETURN v_is_admin;
  END IF;
  
  -- If not found by user_id, try with email
  SELECT id, is_admin, TRUE INTO v_pilot_id, v_is_admin, v_exists
  FROM public.pilots 
  WHERE email = p_email
  LIMIT 1;
  
  IF v_exists THEN
    -- Update user_id if found by email
    UPDATE public.pilots
    SET user_id = p_user_id
    WHERE id = v_pilot_id;
    
    RETURN v_is_admin;
  END IF;
  
  -- Not found at all
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update pilot admin status
CREATE OR REPLACE FUNCTION public.update_pilot_admin_status(p_email TEXT, p_user_id UUID)
RETURNS boolean AS $$
BEGIN
  UPDATE public.pilots
  SET is_admin = TRUE, 
      user_id = p_user_id
  WHERE email = p_email;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create admin pilot
CREATE OR REPLACE FUNCTION public.create_admin_pilot(p_name TEXT, p_email TEXT, p_user_id UUID)
RETURNS boolean AS $$
BEGIN
  INSERT INTO public.pilots (
    name, 
    email,
    is_admin,
    is_hidden,
    user_id
  ) VALUES (
    p_name,
    p_email,
    TRUE,
    FALSE,
    p_user_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all pilots
CREATE OR REPLACE FUNCTION public.get_all_pilots()
RETURNS SETOF public.pilots AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.pilots ORDER BY name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all aircraft
CREATE OR REPLACE FUNCTION public.get_all_aircraft()
RETURNS TABLE (
  id UUID,
  tail_number TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  category TEXT,
  tach_time NUMERIC,
  oil_change NUMERIC,
  last_annual DATE,
  ownership TEXT,
  image_url TEXT,
  last_flight TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY SELECT 
    a.id,
    a.tail_number,
    a.make,
    a.model,
    a.year,
    a.category,
    a.tach_time,
    a.oil_change,
    a.last_annual,
    a.ownership,
    a.image_url,
    a.last_flight,
    a.created_at,
    a.updated_at
  FROM public.aircraft a
  ORDER BY a.tail_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all flights
CREATE OR REPLACE FUNCTION public.get_all_flights()
RETURNS TABLE (
  id UUID,
  aircraft_id UUID,
  pilot_id UUID,
  pilot_name TEXT,
  date DATE,
  tach_start NUMERIC,
  tach_end NUMERIC,
  hobbs_time NUMERIC,
  fuel_added NUMERIC,
  oil_added NUMERIC,
  passenger_count INTEGER,
  route TEXT,
  squawks TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  departure_time TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT 
    f.id,
    f.aircraft_id,
    f.pilot_id,
    p.name AS pilot_name,
    f.date,
    f.tach_start,
    f.tach_end,
    f.hobbs_time,
    f.fuel_added,
    f.oil_added,
    f.passenger_count,
    f.route,
    f.squawks,
    f.notes,
    f.created_at,
    f.updated_at,
    f.category,
    f.departure_time
  FROM public.flights f
  LEFT JOIN public.pilots p ON f.pilot_id = p.id
  ORDER BY f.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get flights by aircraft
CREATE OR REPLACE FUNCTION public.get_flights_by_aircraft(p_aircraft_id UUID)
RETURNS TABLE (
  id UUID,
  aircraft_id UUID,
  pilot_id UUID,
  pilot_name TEXT,
  date DATE,
  tach_start NUMERIC,
  tach_end NUMERIC,
  hobbs_time NUMERIC,
  fuel_added NUMERIC,
  oil_added NUMERIC,
  passenger_count INTEGER,
  route TEXT,
  squawks TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  departure_time TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT 
    f.id,
    f.aircraft_id,
    f.pilot_id,
    p.name AS pilot_name,
    f.date,
    f.tach_start,
    f.tach_end,
    f.hobbs_time,
    f.fuel_added,
    f.oil_added,
    f.passenger_count,
    f.route,
    f.squawks,
    f.notes,
    f.created_at,
    f.updated_at,
    f.category,
    f.departure_time
  FROM public.flights f
  LEFT JOIN public.pilots p ON f.pilot_id = p.id
  WHERE f.aircraft_id = p_aircraft_id
  ORDER BY f.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get flight by id
CREATE OR REPLACE FUNCTION public.get_flight_by_id(p_flight_id UUID)
RETURNS TABLE (
  id UUID,
  aircraft_id UUID,
  pilot_id UUID,
  pilot_name TEXT,
  date DATE,
  tach_start NUMERIC,
  tach_end NUMERIC,
  hobbs_time NUMERIC,
  fuel_added NUMERIC,
  oil_added NUMERIC,
  passenger_count INTEGER,
  route TEXT,
  squawks TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  departure_time TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT 
    f.id,
    f.aircraft_id,
    f.pilot_id,
    p.name AS pilot_name,
    f.date,
    f.tach_start,
    f.tach_end,
    f.hobbs_time,
    f.fuel_added,
    f.oil_added,
    f.passenger_count,
    f.route,
    f.squawks,
    f.notes,
    f.created_at,
    f.updated_at,
    f.category,
    f.departure_time
  FROM public.flights f
  LEFT JOIN public.pilots p ON f.pilot_id = p.id
  WHERE f.id = p_flight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a flight
CREATE OR REPLACE FUNCTION public.create_flight(p_flight_data JSONB)
RETURNS TABLE (
  id UUID,
  aircraft_id UUID,
  pilot_id UUID,
  pilot_name TEXT,
  date DATE,
  tach_start NUMERIC,
  tach_end NUMERIC,
  hobbs_time NUMERIC,
  fuel_added NUMERIC,
  oil_added NUMERIC,
  passenger_count INTEGER,
  route TEXT,
  squawks TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  departure_time TEXT
) AS $$
DECLARE
  v_flight_id UUID;
  v_timestamp TIMESTAMPTZ := now();
BEGIN
  -- Insert the new flight
  INSERT INTO public.flights (
    aircraft_id,
    pilot_id,
    date,
    tach_start,
    tach_end,
    hobbs_time,
    fuel_added,
    oil_added,
    passenger_count,
    route,
    squawks,
    notes,
    category,
    departure_time,
    created_at,
    updated_at
  ) VALUES (
    (p_flight_data->>'aircraft_id')::UUID,
    (p_flight_data->>'pilot_id')::UUID,
    (p_flight_data->>'date')::DATE,
    (p_flight_data->>'tach_start')::NUMERIC,
    (p_flight_data->>'tach_end')::NUMERIC,
    (p_flight_data->>'hobbs_time')::NUMERIC,
    (p_flight_data->>'fuel_added')::NUMERIC,
    (p_flight_data->>'oil_added')::NUMERIC,
    (p_flight_data->>'passenger_count')::INTEGER,
    (p_flight_data->>'route'),
    (p_flight_data->>'squawks'),
    (p_flight_data->>'notes'),
    (p_flight_data->>'category'),
    (p_flight_data->>'departure_time'),
    v_timestamp,
    v_timestamp
  )
  RETURNING id INTO v_flight_id;
  
  -- Return the created flight
  RETURN QUERY SELECT 
    f.id,
    f.aircraft_id,
    f.pilot_id,
    p.name AS pilot_name,
    f.date,
    f.tach_start,
    f.tach_end,
    f.hobbs_time,
    f.fuel_added,
    f.oil_added,
    f.passenger_count,
    f.route,
    f.squawks,
    f.notes,
    f.created_at,
    f.updated_at,
    f.category,
    f.departure_time
  FROM public.flights f
  LEFT JOIN public.pilots p ON f.pilot_id = p.id
  WHERE f.id = v_flight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a flight
CREATE OR REPLACE FUNCTION public.update_flight(p_flight_id UUID, p_flight_data JSONB)
RETURNS TABLE (
  id UUID,
  aircraft_id UUID,
  pilot_id UUID,
  pilot_name TEXT,
  date DATE,
  tach_start NUMERIC,
  tach_end NUMERIC,
  hobbs_time NUMERIC,
  fuel_added NUMERIC,
  oil_added NUMERIC,
  passenger_count INTEGER,
  route TEXT,
  squawks TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  departure_time TEXT
) AS $$
BEGIN
  -- Update the flight
  UPDATE public.flights
  SET 
    aircraft_id = COALESCE((p_flight_data->>'aircraft_id')::UUID, aircraft_id),
    pilot_id = COALESCE((p_flight_data->>'pilot_id')::UUID, pilot_id),
    date = COALESCE((p_flight_data->>'date')::DATE, date),
    tach_start = COALESCE((p_flight_data->>'tach_start')::NUMERIC, tach_start),
    tach_end = COALESCE((p_flight_data->>'tach_end')::NUMERIC, tach_end),
    hobbs_time = COALESCE((p_flight_data->>'hobbs_time')::NUMERIC, hobbs_time),
    fuel_added = NULLIF((p_flight_data->>'fuel_added')::NUMERIC, 0),
    oil_added = NULLIF((p_flight_data->>'oil_added')::NUMERIC, 0),
    passenger_count = NULLIF((p_flight_data->>'passenger_count')::INTEGER, 0),
    route = NULLIF(p_flight_data->>'route', ''),
    squawks = NULLIF(p_flight_data->>'squawks', ''),
    notes = NULLIF(p_flight_data->>'notes', ''),
    category = NULLIF(p_flight_data->>'category', ''),
    departure_time = NULLIF(p_flight_data->>'departure_time', ''),
    updated_at = now()
  WHERE id = p_flight_id;
  
  -- Return the updated flight
  RETURN QUERY SELECT 
    f.id,
    f.aircraft_id,
    f.pilot_id,
    p.name AS pilot_name,
    f.date,
    f.tach_start,
    f.tach_end,
    f.hobbs_time,
    f.fuel_added,
    f.oil_added,
    f.passenger_count,
    f.route,
    f.squawks,
    f.notes,
    f.created_at,
    f.updated_at,
    f.category,
    f.departure_time
  FROM public.flights f
  LEFT JOIN public.pilots p ON f.pilot_id = p.id
  WHERE f.id = p_flight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a flight
CREATE OR REPLACE FUNCTION public.delete_flight(p_flight_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.flights
  WHERE id = p_flight_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get most recent flight for an aircraft
CREATE OR REPLACE FUNCTION public.get_most_recent_flight(p_aircraft_id UUID)
RETURNS TABLE (
  id UUID,
  aircraft_id UUID,
  pilot_id UUID,
  pilot_name TEXT,
  date DATE,
  tach_start NUMERIC,
  tach_end NUMERIC,
  hobbs_time NUMERIC,
  fuel_added NUMERIC,
  oil_added NUMERIC,
  passenger_count INTEGER,
  route TEXT,
  squawks TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  departure_time TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT 
    f.id,
    f.aircraft_id,
    f.pilot_id,
    p.name AS pilot_name,
    f.date,
    f.tach_start,
    f.tach_end,
    f.hobbs_time,
    f.fuel_added,
    f.oil_added,
    f.passenger_count,
    f.route,
    f.squawks,
    f.notes,
    f.created_at,
    f.updated_at,
    f.category,
    f.departure_time
  FROM public.flights f
  LEFT JOIN public.pilots p ON f.pilot_id = p.id
  WHERE f.aircraft_id = p_aircraft_id
  ORDER BY f.date DESC, f.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
