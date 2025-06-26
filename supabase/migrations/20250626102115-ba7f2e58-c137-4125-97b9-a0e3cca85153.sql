
-- Corregir la función de eliminar pedido para que funcione con ID parcial
CREATE OR REPLACE FUNCTION public.delete_order_with_items(order_id_param text, hotel_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  found_order_id uuid;
BEGIN
  -- Buscar el pedido por ID completo o parcial
  SELECT id INTO found_order_id
  FROM orders 
  WHERE hotel_id = hotel_id_param 
  AND (id::text = order_id_param OR id::text LIKE order_id_param || '%')
  LIMIT 1;

  -- Verificar que se encontró el pedido
  IF found_order_id IS NULL THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;

  -- Eliminar items del pedido
  DELETE FROM order_items WHERE order_id = found_order_id;
  
  -- Eliminar registros archivados si existen
  DELETE FROM archived_orders 
  WHERE original_order_id = found_order_id AND hotel_id = hotel_id_param;
  
  -- Eliminar el pedido principal
  DELETE FROM orders 
  WHERE id = found_order_id AND hotel_id = hotel_id_param;
END;
$function$;

-- Asegurar que los pedidos se puedan actualizar correctamente
-- Verificar que no hay restricciones que impidan actualizar el status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pendiente', 'preparando', 'completado', 'cancelado'));
