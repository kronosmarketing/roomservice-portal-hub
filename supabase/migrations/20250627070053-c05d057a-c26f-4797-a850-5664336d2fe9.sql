
-- Phase 1: Critical RLS Policy Cleanup and Standardization
-- This migration fixes conflicting policies and implements consistent security across all tables

-- First, drop ALL existing conflicting policies to start clean
DROP POLICY IF EXISTS "Users can view their hotel menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can create menu items for their hotel" ON public.menu_items;
DROP POLICY IF EXISTS "Users can update their hotel menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can delete their hotel menu items" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_select_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_insert_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_update_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_delete_policy" ON public.menu_items;
DROP POLICY IF EXISTS "secure_menu_items_select" ON public.menu_items;
DROP POLICY IF EXISTS "secure_menu_items_insert" ON public.menu_items;
DROP POLICY IF EXISTS "secure_menu_items_update" ON public.menu_items;
DROP POLICY IF EXISTS "secure_menu_items_delete" ON public.menu_items;

-- Drop conflicting menu_categories policies
DROP POLICY IF EXISTS "Users can view their hotel menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can create menu categories for their hotel" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can update their hotel menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can delete their hotel menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_select_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_insert_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_update_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_delete_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "secure_menu_categories_select" ON public.menu_categories;
DROP POLICY IF EXISTS "secure_menu_categories_insert" ON public.menu_categories;
DROP POLICY IF EXISTS "secure_menu_categories_update" ON public.menu_categories;
DROP POLICY IF EXISTS "secure_menu_categories_delete" ON public.menu_categories;

-- Drop conflicting orders policies
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;
DROP POLICY IF EXISTS "secure_orders_select" ON public.orders;
DROP POLICY IF EXISTS "secure_orders_insert" ON public.orders;
DROP POLICY IF EXISTS "secure_orders_update" ON public.orders;
DROP POLICY IF EXISTS "secure_orders_delete" ON public.orders;

-- Drop conflicting order_items policies
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON public.order_items;
DROP POLICY IF EXISTS "secure_order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "secure_order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "secure_order_items_update" ON public.order_items;
DROP POLICY IF EXISTS "secure_order_items_delete" ON public.order_items;

-- Drop conflicting security_audit_log policies
DROP POLICY IF EXISTS "audit_log_select_policy" ON public.security_audit_log;
DROP POLICY IF EXISTS "audit_log_insert_policy" ON public.security_audit_log;

-- Fix the core security function to be more robust
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

-- Add helper function for current user's hotel ID
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

-- Create standardized RLS policies for menu_items
CREATE POLICY "menu_items_access_policy" 
  ON public.menu_items 
  FOR ALL
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

-- Create standardized RLS policies for menu_categories  
CREATE POLICY "menu_categories_access_policy" 
  ON public.menu_categories 
  FOR ALL
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

-- Create standardized RLS policies for orders
CREATE POLICY "orders_access_policy" 
  ON public.orders 
  FOR ALL
  TO authenticated
  USING (public.user_has_hotel_access(hotel_id))
  WITH CHECK (public.user_has_hotel_access(hotel_id));

-- Create standardized RLS policies for order_items
CREATE POLICY "order_items_access_policy" 
  ON public.order_items 
  FOR ALL
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

-- Add missing RLS policy for hotel_user_settings
ALTER TABLE public.hotel_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_user_settings_access_policy" 
  ON public.hotel_user_settings 
  FOR ALL
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Secure the security_audit_log table
CREATE POLICY "security_audit_log_select_policy" 
  ON public.security_audit_log 
  FOR SELECT 
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    public.user_has_hotel_access(hotel_id)
  );

CREATE POLICY "security_audit_log_insert_policy" 
  ON public.security_audit_log 
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Enhanced rate limiting function with better security
CREATE OR REPLACE FUNCTION public.check_secure_rate_limit(
  action_name text,
  max_requests integer DEFAULT 50,
  window_minutes integer DEFAULT 15
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count integer;
  window_start timestamp;
  current_user_id uuid;
BEGIN
  -- Get current user ID safely
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  -- Count recent requests for this user and action
  SELECT COUNT(*) INTO current_count
  FROM public.security_audit_log
  WHERE user_id = current_user_id
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
    current_user_id,
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

-- Session integrity validation function
CREATE OR REPLACE FUNCTION public.validate_user_session_integrity()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_valid boolean := false;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists and is active
  SELECT EXISTS (
    SELECT 1 FROM public.hotel_user_settings 
    WHERE email = (SELECT email FROM auth.users WHERE id = current_user_id)
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
    current_user_id,
    public.get_current_user_hotel_id(),
    'session_integrity_check',
    'security',
    jsonb_build_object('valid', session_valid)
  );
  
  RETURN session_valid;
END;
$$;

-- Ensure RLS is enabled on all critical tables
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
