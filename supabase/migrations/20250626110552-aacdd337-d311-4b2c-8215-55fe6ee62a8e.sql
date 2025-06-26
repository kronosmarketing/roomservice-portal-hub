
-- Primero, obtener el hotel_id del usuario tecuidamosoficial
DO $$
DECLARE
    target_hotel_id uuid;
BEGIN
    -- Buscar el hotel_id del usuario
    SELECT id INTO target_hotel_id
    FROM hotel_user_settings 
    WHERE email = 'tecuidamosoficial@example.com' OR hotel_name ILIKE '%tecuidamos%'
    LIMIT 1;
    
    -- Si se encuentra el hotel, limpiar y agregar datos
    IF target_hotel_id IS NOT NULL THEN
        -- Limpiar todos los pedidos existentes
        DELETE FROM order_items WHERE order_id IN (
            SELECT id FROM orders WHERE hotel_id = target_hotel_id
        );
        DELETE FROM archived_orders WHERE hotel_id = target_hotel_id;
        DELETE FROM orders WHERE hotel_id = target_hotel_id;
        
        -- Insertar 5 nuevos pedidos pendientes
        INSERT INTO orders (hotel_id, room_number, total, status, payment_method, special_instructions, created_at) VALUES
        (target_hotel_id, '101', 25.50, 'pendiente', 'habitacion', 'Sin cebolla en la hamburguesa', NOW() - INTERVAL '10 minutes'),
        (target_hotel_id, '205', 18.75, 'pendiente', 'efectivo', 'Poco picante en la pizza', NOW() - INTERVAL '8 minutes'),
        (target_hotel_id, '312', 32.00, 'pendiente', 'habitacion', NULL, NOW() - INTERVAL '5 minutes'),
        (target_hotel_id, '407', 22.25, 'pendiente', 'tarjeta', 'Extra queso', NOW() - INTERVAL '3 minutes'),
        (target_hotel_id, '156', 29.90, 'pendiente', 'habitacion', 'Bebida sin hielo', NOW() - INTERVAL '1 minute');
        
        RAISE NOTICE 'Pedidos limpiados y agregados para hotel: %', target_hotel_id;
    ELSE
        RAISE NOTICE 'No se encontró el hotel del usuario tecuidamosoficial';
    END IF;
END $$;
