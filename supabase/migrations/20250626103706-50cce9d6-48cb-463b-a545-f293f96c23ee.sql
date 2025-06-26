
-- Eliminar TODAS las versiones de la función existente
DROP FUNCTION IF EXISTS public.delete_order_with_items(uuid, uuid);
DROP FUNCTION IF EXISTS public.delete_order_with_items(text, uuid);

-- Crear la función única y corregida
CREATE OR REPLACE FUNCTION public.delete_order_with_items(order_id_param text, hotel_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  found_order_id uuid;
BEGIN
  -- Log para debugging
  RAISE NOTICE 'Iniciando eliminación - ID búsqueda: %, Hotel: %', order_id_param, hotel_id_param;
  
  -- Buscar el pedido por ID completo o por los primeros 8 caracteres
  SELECT id INTO found_order_id
  FROM orders 
  WHERE hotel_id = hotel_id_param 
  AND (
    id::text = order_id_param 
    OR id::text LIKE order_id_param || '%'
    OR SUBSTRING(id::text, 1, 8) = SUBSTRING(order_id_param, 1, 8)
  )
  ORDER BY 
    CASE 
      WHEN id::text = order_id_param THEN 1
      WHEN id::text LIKE order_id_param || '%' THEN 2
      ELSE 3
    END
  LIMIT 1;

  -- Verificar si se encontró el pedido
  IF found_order_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado para ID: % en hotel: %', order_id_param, hotel_id_param;
  END IF;

  RAISE NOTICE 'Pedido encontrado: %', found_order_id;

  -- Eliminar orden de operaciones: items -> archivos -> pedido principal
  DELETE FROM order_items WHERE order_id = found_order_id;
  RAISE NOTICE 'Items eliminados';
  
  DELETE FROM archived_orders WHERE original_order_id = found_order_id;
  RAISE NOTICE 'Archivos eliminados';
  
  DELETE FROM orders WHERE id = found_order_id AND hotel_id = hotel_id_param;
  RAISE NOTICE 'Pedido principal eliminado exitosamente';

END;
$function$;
