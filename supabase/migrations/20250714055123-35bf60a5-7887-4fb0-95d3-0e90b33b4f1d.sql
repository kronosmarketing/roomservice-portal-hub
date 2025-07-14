-- Create hotel permissions table to control which features each hotel can access
CREATE TABLE public.hotel_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotel_user_settings(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, feature_name)
);

-- Enable RLS
ALTER TABLE public.hotel_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for super_admin access
CREATE POLICY "super_admin_can_manage_all_permissions" 
ON public.hotel_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.hotel_user_settings 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND user_role = 'super_admin'
  )
);

-- Create policy for hotel access to their own permissions
CREATE POLICY "hotels_can_view_own_permissions" 
ON public.hotel_permissions 
FOR SELECT 
USING (hotel_id = get_current_user_hotel_id());

-- Create system settings table for global configurations
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for super_admin only
CREATE POLICY "super_admin_can_manage_system_settings" 
ON public.system_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.hotel_user_settings 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND user_role = 'super_admin'
  )
);

-- Insert default feature permissions for existing hotels
INSERT INTO public.hotel_permissions (hotel_id, feature_name, enabled)
SELECT 
  id as hotel_id,
  feature_name,
  true as enabled
FROM public.hotel_user_settings,
UNNEST(ARRAY['orders', 'menu', 'escandallos', 'proveedores', 'cierres']) AS feature_name
WHERE user_role != 'super_admin';

-- Create function to get user permissions for a hotel
CREATE OR REPLACE FUNCTION public.get_hotel_permissions(target_hotel_id UUID)
RETURNS TABLE(feature_name TEXT, enabled BOOLEAN)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT hp.feature_name, hp.enabled
  FROM public.hotel_permissions hp
  WHERE hp.hotel_id = target_hotel_id;
$$;

-- Create function to check if a feature is enabled for current user's hotel
CREATE OR REPLACE FUNCTION public.is_feature_enabled(feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.hotel_permissions 
     WHERE hotel_id = get_current_user_hotel_id() 
     AND feature_name = $1),
    true -- Default to enabled if no permission record exists
  );
$$;

-- Create function to get all hotels for super admin
CREATE OR REPLACE FUNCTION public.get_all_hotels()
RETURNS TABLE(
  id UUID,
  hotel_name TEXT,
  agent_name TEXT,
  email TEXT,
  phone_roomservice TEXT,
  is_active BOOLEAN,
  user_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    id, hotel_name, agent_name, email, phone_roomservice, 
    is_active, user_role::TEXT, created_at, updated_at
  FROM public.hotel_user_settings
  WHERE user_role != 'super_admin'
  ORDER BY hotel_name ASC;
$$;

-- Create update trigger for hotel_permissions
CREATE OR REPLACE FUNCTION public.update_hotel_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hotel_permissions_updated_at
  BEFORE UPDATE ON public.hotel_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hotel_permissions_updated_at();

-- Create update trigger for system_settings
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_settings_updated_at();