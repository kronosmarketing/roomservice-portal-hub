
-- Limpiar completamente las tablas y recrear con datos válidos
-- Primero eliminar todos los pedidos existentes
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM archived_orders;

-- Buscar el hotel activo y recrear pedidos con items válidos
DO $$
DECLARE
    target_hotel_id uuid;
    menu_item_1 uuid;
    menu_item_2 uuid;
    menu_item_3 uuid;
    menu_item_4 uuid;
    order_1 uuid;
    order_2 uuid;
    order_3 uuid;
    order_4 uuid;
    order_5 uuid;
BEGIN
    -- Buscar el hotel_id activo
    SELECT id INTO target_hotel_id
    FROM hotel_user_settings 
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF target_hotel_id IS NOT NULL THEN
        RAISE NOTICE 'Hotel encontrado: %', target_hotel_id;
        
        -- Crear algunos menu items si no existen suficientes
        INSERT INTO menu_items (id, hotel_id, name, price, description, available, created_at) 
        VALUES 
            (gen_random_uuid(), target_hotel_id, 'Pizza Margherita', 15.50, 'Pizza clásica con tomate y mozzarella', true, NOW()),
            (gen_random_uuid(), target_hotel_id, 'Hamburguesa Completa', 12.90, 'Hamburguesa con queso, lechuga y tomate', true, NOW()),
            (gen_random_uuid(), target_hotel_id, 'Ensalada César', 8.75, 'Ensalada fresca con pollo y aderezo césar', true, NOW()),
            (gen_random_uuid(), target_hotel_id, 'Pasta Carbonara', 11.20, 'Pasta con salsa carbonara tradicional', true, NOW()),
            (gen_random_uuid(), target_hotel_id, 'Sandwich Club', 9.80, 'Sandwich triple con pollo, bacon y verduras', true, NOW())
        ON CONFLICT DO NOTHING;
        
        -- Obtener IDs de los menu items
        SELECT id INTO menu_item_1 FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Pizza Margherita' LIMIT 1;
        SELECT id INTO menu_item_2 FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Hamburguesa Completa' LIMIT 1;
        SELECT id INTO menu_item_3 FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Ensalada César' LIMIT 1;
        SELECT id INTO menu_item_4 FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Pasta Carbonara' LIMIT 1;
        
        -- Pedido 1: Pizza Margherita
        INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
        VALUES (gen_random_uuid(), target_hotel_id, '203', 15.50, 'pendiente', 'tarjeta', 'Sin cebolla extra', NOW() - INTERVAL '12 minutes')
        RETURNING id INTO order_1;
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
        VALUES (order_1, menu_item_1, 1, 15.50, 15.50);
        
        -- Pedido 2: Hamburguesa + Ensalada
        INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
        VALUES (gen_random_uuid(), target_hotel_id, '115', 21.65, 'pendiente', 'habitacion', 'Poco condimento', NOW() - INTERVAL '9 minutes')
        RETURNING id INTO order_2;
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
        VALUES 
            (order_2, menu_item_2, 1, 12.90, 12.90),
            (order_2, menu_item_3, 1, 8.75, 8.75);
        
        -- Pedido 3: Pizza + Pasta + Ensalada
        INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
        VALUES (gen_random_uuid(), target_hotel_id, '308', 35.45, 'preparando', 'efectivo', 'Sin lactosa', NOW() - INTERVAL '6 minutes')
        RETURNING id INTO order_3;
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
        VALUES 
            (order_3, menu_item_1, 1, 15.50, 15.50),
            (order_3, menu_item_4, 1, 11.20, 11.20),
            (order_3, menu_item_3, 1, 8.75, 8.75);
        
        -- Pedido 4: 2 Pizzas + Hamburguesa
        INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
        VALUES (gen_random_uuid(), target_hotel_id, '421', 43.90, 'pendiente', 'habitacion', 'Extra salsa picante', NOW() - INTERVAL '4 minutes')
        RETURNING id INTO order_4;
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
        VALUES 
            (order_4, menu_item_1, 2, 15.50, 31.00),
            (order_4, menu_item_2, 1, 12.90, 12.90);
        
        -- Pedido 5: Pasta Carbonara
        INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
        VALUES (gen_random_uuid(), target_hotel_id, '127', 11.20, 'completado', 'tarjeta', 'Bien caliente', NOW() - INTERVAL '2 minutes')
        RETURNING id INTO order_5;
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
        VALUES (order_5, menu_item_4, 1, 11.20, 11.20);
        
        RAISE NOTICE 'Pedidos recreados exitosamente con items válidos';
    ELSE
        RAISE NOTICE 'No se encontró ningún hotel activo';
    END IF;
END $$;
