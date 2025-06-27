
-- Desactivar RLS temporalmente para limpiar
ALTER TABLE public.hotel_user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "hotel_settings_select" ON public.hotel_user_settings;
DROP POLICY IF EXISTS "hotel_settings_insert" ON public.hotel_user_settings;
DROP POLICY IF EXISTS "hotel_settings_update" ON public.hotel_user_settings;
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete" ON public.order_items;
DROP POLICY IF EXISTS "menu_items_select" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_insert" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_update" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_delete" ON public.menu_items;
DROP POLICY IF EXISTS "menu_categories_select" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_insert" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_update" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_delete" ON public.menu_categories;

-- Recrear función simple para obtener el email del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Habilitar RLS
ALTER TABLE public.hotel_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Políticas simples para hotel_user_settings
CREATE POLICY "Users can access their own settings"
ON public.hotel_user_settings
FOR ALL
TO authenticated
USING (email = public.get_current_user_email())
WITH CHECK (email = public.get_current_user_email());

-- Políticas para orders basadas en el hotel_id del usuario
CREATE POLICY "Users can access orders from their hotel"
ON public.orders
FOR ALL
TO authenticated
USING (
  hotel_id IN (
    SELECT id FROM public.hotel_user_settings 
    WHERE email = public.get_current_user_email()
  )
)
WITH CHECK (
  hotel_id IN (
    SELECT id FROM public.hotel_user_settings 
    WHERE email = public.get_current_user_email()
  )
);

-- Políticas para order_items
CREATE POLICY "Users can access order items from their hotel"
ON public.order_items
FOR ALL
TO authenticated
USING (
  order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.hotel_user_settings h ON o.hotel_id = h.id
    WHERE h.email = public.get_current_user_email()
  )
)
WITH CHECK (
  order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.hotel_user_settings h ON o.hotel_id = h.id
    WHERE h.email = public.get_current_user_email()
  )
);

-- Políticas para menu_items
CREATE POLICY "Users can access menu items from their hotel"
ON public.menu_items
FOR ALL
TO authenticated
USING (
  hotel_id IN (
    SELECT id FROM public.hotel_user_settings 
    WHERE email = public.get_current_user_email()
  )
)
WITH CHECK (
  hotel_id IN (
    SELECT id FROM public.hotel_user_settings 
    WHERE email = public.get_current_user_email()
  )
);

-- Políticas para menu_categories
CREATE POLICY "Users can access menu categories from their hotel"
ON public.menu_categories
FOR ALL
TO authenticated
USING (
  hotel_id IN (
    SELECT id FROM public.hotel_user_settings 
    WHERE email = public.get_current_user_email()
  )
)
WITH CHECK (
  hotel_id IN (
    SELECT id FROM public.hotel_user_settings 
    WHERE email = public.get_current_user_email()
  )
);
