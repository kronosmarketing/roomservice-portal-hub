
-- Eliminar la función existente y recrearla correctamente
DROP FUNCTION IF EXISTS public.delete_order_with_items(text, uuid);

-- Crear la función corregida para eliminar pedidos
CREATE OR REPLACE FUNCTION public.delete_order_with_items(order_id_param text, hotel_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  found_order_id uuid;
BEGIN
  -- Log para debugging
  RAISE NOTICE 'Buscando pedido con ID: % para hotel: %', order_id_param, hotel_id_param;
  
  -- Buscar el pedido por ID completo o parcial (solo los primeros 8 caracteres)
  SELECT id INTO found_order_id
  FROM orders 
  WHERE hotel_id = hotel_id_param 
  AND (
    id::text = order_id_param 
    OR id::text ILIKE order_id_param || '%'
    OR LEFT(id::text, 8) = LEFT(order_id_param, 8)
  )
  LIMIT 1;

  -- Log del resultado de búsqueda
  RAISE NOTICE 'ID encontrado: %', found_order_id;

  -- Verificar que se encontró el pedido
  IF found_order_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado o acceso denegado para ID: %', order_id_param;
  END IF;

  -- Eliminar items del pedido primero
  DELETE FROM order_items WHERE order_id = found_order_id;
  RAISE NOTICE 'Items eliminados para pedido: %', found_order_id;
  
  -- Eliminar registros archivados si existen
  DELETE FROM archived_orders 
  WHERE original_order_id = found_order_id AND hotel_id = hotel_id_param;
  RAISE NOTICE 'Registros archivados eliminados para pedido: %', found_order_id;
  
  -- Eliminar el pedido principal
  DELETE FROM orders 
  WHERE id = found_order_id AND hotel_id = hotel_id_param;
  RAISE NOTICE 'Pedido principal eliminado: %', found_order_id;

  -- Confirmar eliminación exitosa
  RAISE NOTICE 'Pedido % eliminado exitosamente', found_order_id;
END;
$function$;
