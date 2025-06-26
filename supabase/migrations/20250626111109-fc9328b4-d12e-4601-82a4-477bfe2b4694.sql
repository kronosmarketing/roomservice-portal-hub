
-- Actualizar pedidos para kronosiamarketing usando sus menu_items existentes
DO $$
DECLARE
    target_hotel_id uuid;
    existing_items uuid[];
    order_1 uuid;
    order_2 uuid;
    order_3 uuid;
    order_4 uuid;
    order_5 uuid;
BEGIN
    -- Buscar el hotel_id del usuario kronosiamarketing
    SELECT id INTO target_hotel_id
    FROM hotel_user_settings 
    WHERE email ILIKE '%kronosiamarketing%' OR hotel_name ILIKE '%kronosia%' OR agent_name ILIKE '%kronosia%'
    LIMIT 1;
    
    IF target_hotel_id IS NOT NULL THEN
        -- Obtener los IDs de los menu_items existentes para este hotel
        SELECT ARRAY(SELECT id FROM menu_items WHERE hotel_id = target_hotel_id ORDER BY created_at LIMIT 10) INTO existing_items;
        
        -- Verificar que hay suficientes items en el menú
        IF array_length(existing_items, 1) >= 4 THEN
            -- Limpiar pedidos existentes
            DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE hotel_id = target_hotel_id);
            DELETE FROM orders WHERE hotel_id = target_hotel_id;
            
            -- Pedido 1: 1 plato - Usando el primer item del menú
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '203', 0, 'pendiente', 'tarjeta', 'Sin cebolla', NOW() - INTERVAL '12 minutes')
            RETURNING id INTO order_1;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_1, existing_items[1], 1, price, price
            FROM menu_items WHERE id = existing_items[1];
            
            -- Actualizar total del pedido 1
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_1) WHERE id = order_1;
            
            -- Pedido 2: 2 platos - Usando items 2 y 3
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '115', 0, 'pendiente', 'habitacion', 'Poco condimento', NOW() - INTERVAL '9 minutes')
            RETURNING id INTO order_2;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_2, existing_items[2], 1, price, price
            FROM menu_items WHERE id = existing_items[2];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_2, existing_items[3], 1, price, price
            FROM menu_items WHERE id = existing_items[3];
            
            -- Actualizar total del pedido 2
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_2) WHERE id = order_2;
            
            -- Pedido 3: 3 platos - Usando items 1, 4 y 2
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '308', 0, 'pendiente', 'efectivo', 'Sin lactosa', NOW() - INTERVAL '6 minutes')
            RETURNING id INTO order_3;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_3, existing_items[1], 1, price, price
            FROM menu_items WHERE id = existing_items[1];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_3, existing_items[4], 1, price, price
            FROM menu_items WHERE id = existing_items[4];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_3, existing_items[2], 1, price, price
            FROM menu_items WHERE id = existing_items[2];
            
            -- Actualizar total del pedido 3
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_3) WHERE id = order_3;
            
            -- Pedido 4: 4 platos - Usando items 3, 4, 1 y 2
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '421', 0, 'pendiente', 'habitacion', 'Extra salsa', NOW() - INTERVAL '4 minutes')
            RETURNING id INTO order_4;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_4, existing_items[3], 1, price, price
            FROM menu_items WHERE id = existing_items[3];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_4, existing_items[4], 1, price, price
            FROM menu_items WHERE id = existing_items[4];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_4, existing_items[1], 2, price, price * 2
            FROM menu_items WHERE id = existing_items[1];
            
            -- Actualizar total del pedido 4
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_4) WHERE id = order_4;
            
            -- Pedido 5: 1 plato - Usando el segundo item del menú
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '127', 0, 'pendiente', 'tarjeta', 'Bien caliente', NOW() - INTERVAL '2 minutes')
            RETURNING id INTO order_5;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_5, existing_items[2], 1, price, price
            FROM menu_items WHERE id = existing_items[2];
            
            -- Actualizar total del pedido 5
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_5) WHERE id = order_5;
            
            RAISE NOTICE 'Pedidos creados exitosamente usando menu items existentes para kronosiamarketing: %', target_hotel_id;
        ELSE
            RAISE NOTICE 'No hay suficientes items en el menú para crear los pedidos de ejemplo';
        END IF;
    ELSE
        RAISE NOTICE 'No se encontró el hotel del usuario kronosiamarketing';
    END IF;
END $$;
