
-- Enable RLS on all tables
ALTER TABLE public.hotel_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own hotel settings" ON public.hotel_user_settings;
DROP POLICY IF EXISTS "Users can update their own hotel settings" ON public.hotel_user_settings;
DROP POLICY IF EXISTS "Users can insert their own hotel settings" ON public.hotel_user_settings;
DROP POLICY IF EXISTS "Users can view orders for their hotel" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders for their hotel" ON public.orders;
DROP POLICY IF EXISTS "Users can update orders for their hotel" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for their hotel orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their hotel orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can view menu items for their hotel" ON public.menu_items;
DROP POLICY IF EXISTS "Users can manage menu items for their hotel" ON public.menu_items;
DROP POLICY IF EXISTS "Users can view menu categories for their hotel" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can manage menu categories for their hotel" ON public.menu_categories;

-- Hotel user settings policies
CREATE POLICY "Users can view their own hotel settings"
ON public.hotel_user_settings
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own hotel settings"
ON public.hotel_user_settings
FOR UPDATE
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own hotel settings"
ON public.hotel_user_settings
FOR INSERT
TO authenticated
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Orders policies
CREATE POLICY "Users can view orders for their hotel"
ON public.orders
FOR SELECT
TO authenticated
USING (hotel_id = public.get_current_user_hotel_id());

CREATE POLICY "Users can insert orders for their hotel"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (hotel_id = public.get_current_user_hotel_id());

CREATE POLICY "Users can update orders for their hotel"
ON public.orders
FOR UPDATE
TO authenticated
USING (hotel_id = public.get_current_user_hotel_id())
WITH CHECK (hotel_id = public.get_current_user_hotel_id());

-- Order items policies
CREATE POLICY "Users can view order items for their hotel orders"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.hotel_id = public.get_current_user_hotel_id()
  )
);

CREATE POLICY "Users can insert order items for their hotel orders"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.hotel_id = public.get_current_user_hotel_id()
  )
);

-- Menu items policies
CREATE POLICY "Users can view menu items for their hotel"
ON public.menu_items
FOR SELECT
TO authenticated
USING (hotel_id = public.get_current_user_hotel_id());

CREATE POLICY "Users can manage menu items for their hotel"
ON public.menu_items
FOR ALL
TO authenticated
USING (hotel_id = public.get_current_user_hotel_id())
WITH CHECK (hotel_id = public.get_current_user_hotel_id());

-- Menu categories policies
CREATE POLICY "Users can view menu categories for their hotel"
ON public.menu_categories
FOR SELECT
TO authenticated
USING (hotel_id = public.get_current_user_hotel_id());

CREATE POLICY "Users can manage menu categories for their hotel"
ON public.menu_categories
FOR ALL
TO authenticated
USING (hotel_id = public.get_current_user_hotel_id())
WITH CHECK (hotel_id = public.get_current_user_hotel_id());

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Set replica identity for realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
