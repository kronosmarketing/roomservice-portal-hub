
-- Phase 1: Critical RLS Policy Cleanup
-- Remove all existing conflicting policies and create standardized ones

-- Drop all existing policies on menu_items (they conflict with each other)
DROP POLICY IF EXISTS "Users can view their hotel menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can create menu items for their hotel" ON public.menu_items;
DROP POLICY IF EXISTS "Users can update their hotel menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can delete their hotel menu items" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_select_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_insert_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_update_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_delete_policy" ON public.menu_items;

-- Drop all existing policies on menu_categories (they conflict with each other)
DROP POLICY IF EXISTS "Users can view their hotel menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can create menu categories for their hotel" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can update their hotel menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can delete their hotel menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_select_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_insert_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_update_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_delete_policy" ON public.menu_categories;

-- Drop existing policies on orders
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;

-- Drop existing policies on order_items
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON public.order_items;

-- Create standardized RLS policies using the secure user_has_hotel_access function

-- Menu Items Policies
CREATE POLICY "secure_menu_items_select" 
  ON public.menu_items 
  FOR SELECT 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_menu_items_insert" 
  ON public.menu_items 
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_menu_items_update" 
  ON public.menu_items 
  FOR UPDATE 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_menu_items_delete" 
  ON public.menu_items 
  FOR DELETE 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id));

-- Menu Categories Policies
CREATE POLICY "secure_menu_categories_select" 
  ON public.menu_categories 
  FOR SELECT 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_menu_categories_insert" 
  ON public.menu_categories 
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_menu_categories_update" 
  ON public.menu_categories 
  FOR UPDATE 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_menu_categories_delete" 
  ON public.menu_categories 
  FOR DELETE 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id));

-- Orders Policies
CREATE POLICY "secure_orders_select" 
  ON public.orders 
  FOR SELECT 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_orders_insert" 
  ON public.orders 
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_orders_update" 
  ON public.orders 
  FOR UPDATE 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

CREATE POLICY "secure_orders_delete" 
  ON public.orders 
  FOR DELETE 
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id));

-- Order Items Policies
CREATE POLICY "secure_order_items_select" 
  ON public.order_items 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND public.user_has_hotel_access(orders.hotel_id)
    )
  );

CREATE POLICY "secure_order_items_insert" 
  ON public.order_items 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND public.user_has_hotel_access(orders.hotel_id)
    )
  );

CREATE POLICY "secure_order_items_update" 
  ON public.order_items 
  FOR UPDATE 
  TO authenticated
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

CREATE POLICY "secure_order_items_delete" 
  ON public.order_items 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND public.user_has_hotel_access(orders.hotel_id)
    )
  );

-- Ensure RLS is enabled on all tables
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Enhanced security function to check rate limiting with IP tracking
CREATE OR REPLACE FUNCTION public.check_rate_limit_with_audit(
  action_name text,
  max_requests integer DEFAULT 100,
  window_minutes integer DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count integer;
  window_start timestamp;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  -- Count recent requests for this user and action
  SELECT COUNT(*) INTO current_count
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND action = action_name
    AND created_at > window_start;
  
  -- Log the rate limit check
  INSERT INTO public.security_audit_log (
    user_id,
    hotel_id,
    action,
    resource_type,
    details
  ) VALUES (
    auth.uid(),
    public.get_current_user_hotel_id(),
    'rate_limit_check',
    'security',
    jsonb_build_object(
      'action_checked', action_name,
      'current_count', current_count,
      'limit', max_requests,
      'window_minutes', window_minutes,
      'allowed', current_count < max_requests
    )
  );
  
  RETURN current_count < max_requests;
END;
$$;

-- Function to validate session integrity
CREATE OR REPLACE FUNCTION public.validate_session_integrity()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_valid boolean := false;
BEGIN
  -- Check if user exists and is active
  SELECT EXISTS (
    SELECT 1 FROM public.hotel_user_settings 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  ) INTO session_valid;
  
  -- Log session validation
  INSERT INTO public.security_audit_log (
    user_id,
    hotel_id,
    action,
    resource_type,
    details
  ) VALUES (
    auth.uid(),
    public.get_current_user_hotel_id(),
    'session_validation',
    'security',
    jsonb_build_object('valid', session_valid)
  );
  
  RETURN session_valid;
END;
$$;
