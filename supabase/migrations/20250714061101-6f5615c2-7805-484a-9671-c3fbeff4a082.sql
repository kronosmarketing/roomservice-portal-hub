-- Create SECURITY DEFINER function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hotel_user_settings 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND user_role = 'super_admin'
  );
$$;

-- Update hotel_permissions policies to use SECURITY DEFINER function
DROP POLICY IF EXISTS "super_admin_can_manage_all_permissions" ON public.hotel_permissions;
CREATE POLICY "super_admin_can_manage_all_permissions" 
ON public.hotel_permissions 
FOR ALL 
USING (public.is_current_user_super_admin());

-- Update system_settings policies to use SECURITY DEFINER function  
DROP POLICY IF EXISTS "super_admin_can_manage_system_settings" ON public.system_settings;
CREATE POLICY "super_admin_can_manage_system_settings" 
ON public.system_settings 
FOR ALL 
USING (public.is_current_user_super_admin());

-- Update hotel_user_settings policy to use SECURITY DEFINER function
DROP POLICY IF EXISTS "hotel_settings_access" ON public.hotel_user_settings;
CREATE POLICY "hotel_settings_access" 
ON public.hotel_user_settings 
FOR ALL 
USING (
  email = public.get_current_user_email() OR 
  public.is_current_user_super_admin()
)
WITH CHECK (
  email = public.get_current_user_email() OR 
  public.is_current_user_super_admin()
);