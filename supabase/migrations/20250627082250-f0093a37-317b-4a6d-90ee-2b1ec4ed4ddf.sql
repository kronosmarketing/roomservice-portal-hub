
-- Deshabilitar RLS temporalmente para limpiar
ALTER TABLE public.hotel_user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de forma más exhaustiva
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Eliminar todas las políticas de hotel_user_settings
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'hotel_user_settings' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.hotel_user_settings';
    END LOOP;
    
    -- Eliminar todas las políticas de menu_categories
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_categories' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.menu_categories';
    END LOOP;
    
    -- Eliminar todas las políticas de menu_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_items' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.menu_items';
    END LOOP;
    
    -- Eliminar todas las políticas de orders
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.orders';
    END LOOP;
    
    -- Eliminar todas las políticas de order_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'order_items' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.order_items';
    END LOOP;
    
    -- Eliminar todas las políticas de archived_orders
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'archived_orders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.archived_orders';
    END LOOP;
    
    -- Eliminar todas las políticas de security_audit_log
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'security_audit_log' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.security_audit_log';
    END LOOP;
END $$;

-- Recrear las funciones de seguridad
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

-- Habilitar RLS de nuevo
ALTER TABLE public.hotel_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Crear las políticas RLS nuevas
CREATE POLICY "hotel_settings_access"
ON public.hotel_user_settings
FOR ALL
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "menu_categories_access"
ON public.menu_categories
FOR ALL
TO authenticated
USING (public.user_has_hotel_access(hotel_id))
WITH CHECK (hotel_id = public.get_current_user_hotel_id());

CREATE POLICY "menu_items_access"
ON public.menu_items
FOR ALL
TO authenticated
USING (public.user_has_hotel_access(hotel_id))
WITH CHECK (hotel_id = public.get_current_user_hotel_id());

CREATE POLICY "orders_access"  
ON public.orders
FOR ALL
TO authenticated
USING (public.user_has_hotel_access(hotel_id))
WITH CHECK (hotel_id = public.get_current_user_hotel_id());

CREATE POLICY "order_items_access"
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
    AND orders.hotel_id = public.get_current_user_hotel_id()
  )
);

CREATE POLICY "archived_orders_access"
ON public.archived_orders
FOR ALL
TO authenticated
USING (public.user_has_hotel_access(hotel_id))
WITH CHECK (hotel_id = public.get_current_user_hotel_id());

CREATE POLICY "audit_log_access"
ON public.security_audit_log
FOR ALL
TO authenticated
USING (
  hotel_id IS NULL OR public.user_has_hotel_access(hotel_id)
)
WITH CHECK (
  hotel_id IS NULL OR hotel_id = public.get_current_user_hotel_id()
);

-- Asegurar que todos los usuarios autenticados tienen un perfil
INSERT INTO public.hotel_user_settings (email, hotel_name, agent_name, user_role, is_active)
SELECT 
  u.email,
  'Hotel Ejemplo',
  'Agente IA',
  'hotel_manager',
  true
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- Insertar datos de ejemplo para todos los usuarios
DO $$
DECLARE
  hotel_record RECORD;
BEGIN
  FOR hotel_record IN SELECT id, email FROM public.hotel_user_settings WHERE is_active = true LOOP
    -- Insertar categorías si no existen
    INSERT INTO public.menu_categories (hotel_id, name, description, display_order)
    SELECT hotel_record.id, 'Aperitivos', 'Entrantes y aperitivos', 1
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Aperitivos');
    
    INSERT INTO public.menu_categories (hotel_id, name, description, display_order)
    SELECT hotel_record.id, 'Platos Principales', 'Platos principales del menú', 2
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Platos Principales');
    
    INSERT INTO public.menu_categories (hotel_id, name, description, display_order)
    SELECT hotel_record.id, 'Postres', 'Dulces y postres', 3
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Postres');
    
    INSERT INTO public.menu_categories (hotel_id, name, description, display_order)
    SELECT hotel_record.id, 'Bebidas', 'Bebidas y refrescos', 4
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Bebidas');
    
    -- Insertar items de menú
    INSERT INTO public.menu_items (hotel_id, category_id, name, description, price, preparation_time, allergens)
    SELECT 
      hotel_record.id,
      (SELECT id FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Aperitivos' LIMIT 1),
      'Jamón Ibérico',
      'Jamón ibérico de bellota con pan tostado',
      18.50,
      5,
      ARRAY['gluten']
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE hotel_id = hotel_record.id AND name = 'Jamón Ibérico');
    
    INSERT INTO public.menu_items (hotel_id, category_id, name, description, price, preparation_time, allergens)
    SELECT 
      hotel_record.id,
      (SELECT id FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Aperitivos' LIMIT 1),
      'Croquetas de Jamón',
      'Croquetas caseras de jamón (6 unidades)',
      12.00,
      10,
      ARRAY['gluten', 'lácteos', 'huevo']
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE hotel_id = hotel_record.id AND name = 'Croquetas de Jamón');
    
    INSERT INTO public.menu_items (hotel_id, category_id, name, description, price, preparation_time, allergens)
    SELECT 
      hotel_record.id,
      (SELECT id FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Platos Principales' LIMIT 1),
      'Paella Valenciana',
      'Paella tradicional valenciana para 2 personas',
      35.00,
      25,
      ARRAY['mariscos']
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE hotel_id = hotel_record.id AND name = 'Paella Valenciana');
    
    INSERT INTO public.menu_items (hotel_id, category_id, name, description, price, preparation_time, allergens)
    SELECT 
      hotel_record.id,
      (SELECT id FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Platos Principales' LIMIT 1),
      'Solomillo de Ternera',
      'Solomillo a la plancha con patatas y verduras',
      28.00,
      15,
      NULL
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE hotel_id = hotel_record.id AND name = 'Solomillo de Ternera');
    
    INSERT INTO public.menu_items (hotel_id, category_id, name, description, price, preparation_time, allergens)
    SELECT 
      hotel_record.id,
      (SELECT id FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Postres' LIMIT 1),
      'Tiramisú',
      'Tiramisú casero italiano',
      8.50,
      5,
      ARRAY['lácteos', 'huevo', 'gluten']
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE hotel_id = hotel_record.id AND name = 'Tiramisú');
    
    INSERT INTO public.menu_items (hotel_id, category_id, name, description, price, preparation_time, allergens)
    SELECT 
      hotel_record.id,
      (SELECT id FROM public.menu_categories WHERE hotel_id = hotel_record.id AND name = 'Bebidas' LIMIT 1),
      'Agua Mineral',
      'Agua mineral 50cl',
      2.50,
      1,
      NULL
    WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE hotel_id = hotel_record.id AND name = 'Agua Mineral');
    
  END LOOP;
END $$;
