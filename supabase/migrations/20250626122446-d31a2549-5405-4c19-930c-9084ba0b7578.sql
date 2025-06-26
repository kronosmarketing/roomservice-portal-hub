
-- Phase 1: Critical RLS Policy Cleanup
-- First, let's clean up the existing RLS policies and implement consistent ones

-- Drop existing conflicting policies on menu_items
DROP POLICY IF EXISTS "Users can view their hotel menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can create menu items for their hotel" ON public.menu_items;
DROP POLICY IF EXISTS "Users can update their hotel menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can delete their hotel menu items" ON public.menu_items;

-- Drop existing conflicting policies on menu_categories
DROP POLICY IF EXISTS "Users can view their hotel menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can create menu categories for their hotel" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can update their hotel menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can delete their hotel menu categories" ON public.menu_categories;

-- Create improved security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_hotel_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.hotel_user_settings 
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_hotel_access(target_hotel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hotel_user_settings 
    WHERE id = target_hotel_id 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  );
$$;

-- Create comprehensive RLS policies for menu_items
CREATE POLICY "menu_items_select_policy" 
  ON public.menu_items 
  FOR SELECT 
  USING (public.user_has_hotel_access(hotel_id));

CREATE POLICY "menu_items_insert_policy" 
  ON public.menu_items 
  FOR INSERT 
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "menu_items_update_policy" 
  ON public.menu_items 
  FOR UPDATE 
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "menu_items_delete_policy" 
  ON public.menu_items 
  FOR DELETE 
  USING (public.user_has_hotel_access(hotel_id));

-- Create comprehensive RLS policies for menu_categories
CREATE POLICY "menu_categories_select_policy" 
  ON public.menu_categories 
  FOR SELECT 
  USING (public.user_has_hotel_access(hotel_id));

CREATE POLICY "menu_categories_insert_policy" 
  ON public.menu_categories 
  FOR INSERT 
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "menu_categories_update_policy" 
  ON public.menu_categories 
  FOR UPDATE 
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "menu_categories_delete_policy" 
  ON public.menu_categories 
  FOR DELETE 
  USING (public.user_has_hotel_access(hotel_id));

-- Enable RLS on orders table and create policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_policy" 
  ON public.orders 
  FOR SELECT 
  USING (public.user_has_hotel_access(hotel_id));

CREATE POLICY "orders_insert_policy" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "orders_update_policy" 
  ON public.orders 
  FOR UPDATE 
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "orders_delete_policy" 
  ON public.orders 
  FOR DELETE 
  USING (public.user_has_hotel_access(hotel_id));

-- Enable RLS on order_items and create policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_policy" 
  ON public.order_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND public.user_has_hotel_access(orders.hotel_id)
    )
  );

CREATE POLICY "order_items_insert_policy" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND public.user_has_hotel_access(orders.hotel_id)
    )
  );

CREATE POLICY "order_items_update_policy" 
  ON public.order_items 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND public.user_has_hotel_access(orders.hotel_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND public.user_has_hotel_access(orders.hotel_id)
    )
  );

CREATE POLICY "order_items_delete_policy" 
  ON public.order_items 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND public.user_has_hotel_access(orders.hotel_id)
    )
  );

-- Create security audit logging table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  hotel_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow viewing own audit logs or if user is admin
CREATE POLICY "audit_log_select_policy" 
  ON public.security_audit_log 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    public.user_has_hotel_access(hotel_id)
  );

-- Only system can insert audit logs
CREATE POLICY "audit_log_insert_policy" 
  ON public.security_audit_log 
  FOR INSERT 
  WITH CHECK (true);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    hotel_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    public.get_current_user_hotel_id(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$;
