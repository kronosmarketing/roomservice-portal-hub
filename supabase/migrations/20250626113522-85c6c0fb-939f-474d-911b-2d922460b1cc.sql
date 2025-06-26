
-- Habilitar RLS en las tablas de menú
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Políticas para menu_items - Los usuarios solo pueden ver/editar los items de su hotel
CREATE POLICY "Users can view their hotel menu items" 
  ON public.menu_items 
  FOR SELECT 
  USING (hotel_id = get_current_user_hotel_id());

CREATE POLICY "Users can create menu items for their hotel" 
  ON public.menu_items 
  FOR INSERT 
  WITH CHECK (hotel_id = get_current_user_hotel_id());

CREATE POLICY "Users can update their hotel menu items" 
  ON public.menu_items 
  FOR UPDATE 
  USING (hotel_id = get_current_user_hotel_id());

CREATE POLICY "Users can delete their hotel menu items" 
  ON public.menu_items 
  FOR DELETE 
  USING (hotel_id = get_current_user_hotel_id());

-- Políticas para menu_categories - Los usuarios solo pueden ver/editar las categorías de su hotel
CREATE POLICY "Users can view their hotel menu categories" 
  ON public.menu_categories 
  FOR SELECT 
  USING (hotel_id = get_current_user_hotel_id());

CREATE POLICY "Users can create menu categories for their hotel" 
  ON public.menu_categories 
  FOR INSERT 
  WITH CHECK (hotel_id = get_current_user_hotel_id());

CREATE POLICY "Users can update their hotel menu categories" 
  ON public.menu_categories 
  FOR UPDATE 
  USING (hotel_id = get_current_user_hotel_id());

CREATE POLICY "Users can delete their hotel menu categories" 
  ON public.menu_categories 
  FOR DELETE 
  USING (hotel_id = get_current_user_hotel_id());
