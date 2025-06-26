
-- Add sample orders for manelgon92@gmail.com with proper menu items
DO $$
DECLARE
    target_hotel_id uuid;
    sample_menu_item_1 uuid;
    sample_menu_item_2 uuid;
    sample_menu_item_3 uuid;
    category_id uuid;
    order_1 uuid;
    order_2 uuid;
    order_3 uuid;
    order_4 uuid;
    order_5 uuid;
    order_6 uuid;
    order_7 uuid;
    order_8 uuid;
    order_9 uuid;
BEGIN
    -- Buscar el hotel_id del usuario manelgon92@gmail.com
    SELECT id INTO target_hotel_id
    FROM hotel_user_settings 
    WHERE email = 'manelgon92@gmail.com'
    LIMIT 1;
    
    -- Si se encuentra el hotel, crear datos de ejemplo
    IF target_hotel_id IS NOT NULL THEN
        -- Limpiar datos existentes
        DELETE FROM order_items WHERE order_id IN (
            SELECT id FROM orders WHERE hotel_id = target_hotel_id
        );
        DELETE FROM orders WHERE hotel_id = target_hotel_id;
        DELETE FROM menu_items WHERE hotel_id = target_hotel_id;
        DELETE FROM menu_categories WHERE hotel_id = target_hotel_id;
        
        -- Crear categorías de menú
        INSERT INTO menu_categories (id, hotel_id, name, description, display_order) VALUES
        (gen_random_uuid(), target_hotel_id, 'Entrantes', 'Aperitivos y entrantes', 1),
        (gen_random_uuid(), target_hotel_id, 'Platos Principales', 'Carnes, pescados y arroces', 2),
        (gen_random_uuid(), target_hotel_id, 'Postres', 'Dulces y postres caseros', 3),
        (gen_random_uuid(), target_hotel_id, 'Bebidas', 'Refrescos, vinos y cervezas', 4);
        
        -- Obtener la primera categoría para los items de ejemplo
        SELECT id INTO category_id FROM menu_categories WHERE hotel_id = target_hotel_id LIMIT 1;
        
        -- Crear items de menú de ejemplo
        INSERT INTO menu_items (id, hotel_id, category_id, name, description, price, available) VALUES
        (gen_random_uuid(), target_hotel_id, category_id, 'Hamburguesa Clásica', 'Hamburguesa de ternera con queso, lechuga y tomate', 12.50, true),
        (gen_random_uuid(), target_hotel_id, category_id, 'Pizza Margherita', 'Pizza tradicional con tomate, mozzarella y albahaca', 14.00, true),
        (gen_random_uuid(), target_hotel_id, category_id, 'Ensalada César', 'Ensalada fresca con pollo, parmesano y salsa césar', 9.75, true),
        (gen_random_uuid(), target_hotel_id, category_id, 'Paella Valenciana', 'Paella tradicional con pollo, conejo y verduras', 18.00, true),
        (gen_random_uuid(), target_hotel_id, category_id, 'Salmón a la Plancha', 'Salmón fresco con verduras de temporada', 16.50, true),
        (gen_random_uuid(), target_hotel_id, category_id, 'Pasta Carbonara', 'Pasta con huevo, panceta y queso parmesano', 11.00, true),
        (gen_random_uuid(), target_hotel_id, category_id, 'Coca-Cola', 'Refresco de cola 33cl', 2.50, true),
        (gen_random_uuid(), target_hotel_id, category_id, 'Agua Mineral', 'Agua mineral 50cl', 1.80, true),
        (gen_random_uuid(), target_hotel_id, category_id, 'Cerveza Estrella', 'Cerveza nacional 33cl', 3.20, true);
        
        -- Obtener IDs de algunos items para los pedidos
        SELECT id INTO sample_menu_item_1 FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Hamburguesa Clásica';
        SELECT id INTO sample_menu_item_2 FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Pizza Margherita';
        SELECT id INTO sample_menu_item_3 FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Ensalada César';
        
        -- Crear 9 pedidos (3 en cada estado)
        
        -- PEDIDOS PENDIENTES
        INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) VALUES
        (gen_random_uuid(), target_hotel_id, '101', 25.50, 'pendiente', 'habitacion', 'Sin cebolla en la hamburguesa', NOW() - INTERVAL '10 minutes'),
        (gen_random_uuid(), target_hotel_id, '205', 31.75, 'pendiente', 'efectivo', 'Poco picante en la pizza', NOW() - INTERVAL '8 minutes'),
        (gen_random_uuid(), target_hotel_id, '312', 19.25, 'pendiente', 'habitacion', 'Salsa césar aparte', NOW() - INTERVAL '5 minutes');
        
        -- PEDIDOS PREPARANDO
        INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) VALUES
        (gen_random_uuid(), target_hotel_id, '407', 34.00, 'preparando', 'tarjeta', 'Extra queso', NOW() - INTERVAL '25 minutes'),
        (gen_random_uuid(), target_hotel_id, '156', 28.30, 'preparando', 'habitacion', 'Bebida sin hielo', NOW() - INTERVAL '20 minutes'),
        (gen_random_uuid(), target_hotel_id, '223', 42.50, 'preparando', 'efectivo', NULL, NOW() - INTERVAL '15 minutes');
        
        -- PEDIDOS COMPLETADOS
        INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) VALUES
        (gen_random_uuid(), target_hotel_id, '503', 23.20, 'completado', 'habitacion', 'Pasta sin gluten', NOW() - INTERVAL '45 minutes'),
        (gen_random_uuid(), target_hotel_id, '618', 37.80, 'completado', 'tarjeta', 'Salmón poco hecho', NOW() - INTERVAL '35 minutes'),
        (gen_random_uuid(), target_hotel_id, '721', 29.90, 'completado', 'efectivo', 'Con pan extra', NOW() - INTERVAL '30 minutes');
        
        -- Obtener los IDs de los pedidos creados para agregar items
        SELECT id INTO order_1 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '101';
        SELECT id INTO order_2 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '205';
        SELECT id INTO order_3 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '312';
        SELECT id INTO order_4 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '407';
        SELECT id INTO order_5 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '156';
        SELECT id INTO order_6 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '223';
        SELECT id INTO order_7 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '503';
        SELECT id INTO order_8 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '618';
        SELECT id INTO order_9 FROM orders WHERE hotel_id = target_hotel_id AND room_number = '721';
        
        -- Agregar items a los pedidos pendientes
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_1, sample_menu_item_1, 2, 12.50, 25.00, 'Sin cebolla'),
        (order_1, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Agua Mineral'), 1, 1.80, 1.80, NULL);
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_2, sample_menu_item_2, 2, 14.00, 28.00, 'Poco picante'),
        (order_2, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Cerveza Estrella'), 1, 3.20, 3.20, NULL);
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_3, sample_menu_item_3, 2, 9.75, 19.50, 'Salsa aparte');
        
        -- Agregar items a los pedidos en preparación
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_4, sample_menu_item_2, 2, 14.00, 28.00, 'Extra queso'),
        (order_4, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Coca-Cola'), 2, 2.50, 5.00, NULL);
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_5, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Paella Valenciana'), 1, 18.00, 18.00, NULL),
        (order_5, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Agua Mineral'), 2, 1.80, 3.60, 'Sin hielo');
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_6, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Salmón a la Plancha'), 2, 16.50, 33.00, NULL),
        (order_6, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Cerveza Estrella'), 3, 3.20, 9.60, NULL);
        
        -- Agregar items a los pedidos completados
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_7, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Pasta Carbonara'), 2, 11.00, 22.00, 'Sin gluten'),
        (order_7, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Agua Mineral'), 1, 1.80, 1.80, NULL);
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_8, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Salmón a la Plancha'), 2, 16.50, 33.00, 'Poco hecho'),
        (order_8, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Coca-Cola'), 2, 2.50, 5.00, NULL);
        
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
        (order_9, sample_menu_item_1, 2, 12.50, 25.00, 'Con pan extra'),
        (order_9, (SELECT id FROM menu_items WHERE hotel_id = target_hotel_id AND name = 'Cerveza Estrella'), 2, 3.20, 6.40, NULL);
        
        RAISE NOTICE 'Datos de ejemplo creados para usuario manelgon92@gmail.com - Hotel: %', target_hotel_id;
        RAISE NOTICE 'Creadas 4 categorías de menú, 9 items de menú y 9 pedidos (3 por estado)';
    ELSE
        RAISE NOTICE 'No se encontró el usuario manelgon92@gmail.com';
    END IF;
END $$;
