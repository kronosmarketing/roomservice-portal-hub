
-- Limpiar y agregar pedidos para el usuario de kronosiamarketing
DO $$
DECLARE
    target_hotel_id uuid;
BEGIN
    -- Buscar el hotel_id del usuario kronosiamarketing
    SELECT id INTO target_hotel_id
    FROM hotel_user_settings 
    WHERE email ILIKE '%kronosiamarketing%' OR hotel_name ILIKE '%kronosia%' OR agent_name ILIKE '%kronosia%'
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
        (target_hotel_id, '203', 28.75, 'pendiente', 'tarjeta', 'Sin lactosa en el postre', NOW() - INTERVAL '12 minutes'),
        (target_hotel_id, '115', 22.50, 'pendiente', 'habitacion', 'Temperatura ambiente en las bebidas', NOW() - INTERVAL '9 minutes'),
        (target_hotel_id, '308', 35.25, 'pendiente', 'efectivo', NULL, NOW() - INTERVAL '6 minutes'),
        (target_hotel_id, '421', 19.90, 'pendiente', 'habitacion', 'Extra salsa picante', NOW() - INTERVAL '4 minutes'),
        (target_hotel_id, '127', 31.60, 'pendiente', 'tarjeta', 'Sin gluten', NOW() - INTERVAL '2 minutes');
        
        RAISE NOTICE 'Pedidos limpiados y agregados para hotel kronosiamarketing: %', target_hotel_id;
    ELSE
        RAISE NOTICE 'No se encontró el hotel del usuario kronosiamarketing';
    END IF;
END $$;
