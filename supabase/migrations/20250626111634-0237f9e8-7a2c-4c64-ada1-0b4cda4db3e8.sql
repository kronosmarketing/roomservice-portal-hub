
-- Verificar y crear la relación correcta entre order_items y menu_items
-- Primero, eliminar la restricción existente si existe
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- Crear la relación correcta
ALTER TABLE order_items 
ADD CONSTRAINT order_items_menu_item_id_fkey 
FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;

-- Verificar que tenemos datos en menu_items para el hotel
-- Eliminar pedidos existentes y recrear con datos válidos
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE hotel_id IN (
    SELECT id FROM hotel_user_settings WHERE email ILIKE '%kronosia%'
  )
);

DELETE FROM orders WHERE hotel_id IN (
  SELECT id FROM hotel_user_settings WHERE email ILIKE '%kronosia%'
);

-- Recrear pedidos con items válidos
DO $$
DECLARE
    target_hotel_id uuid;
    menu_item_ids uuid[];
    order_1 uuid;
    order_2 uuid;
    order_3 uuid;
    order_4 uuid;
    order_5 uuid;
BEGIN
    -- Buscar el hotel_id
    SELECT id INTO target_hotel_id
    FROM hotel_user_settings 
    WHERE email ILIKE '%kronosia%'
    LIMIT 1;
    
    IF target_hotel_id IS NOT NULL THEN
        -- Obtener IDs de menu items existentes
        SELECT ARRAY(SELECT id FROM menu_items WHERE hotel_id = target_hotel_id ORDER BY created_at LIMIT 10) INTO menu_item_ids;
        
        IF array_length(menu_item_ids, 1) >= 4 THEN
            -- Pedido 1: Pizza
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '203', 0, 'pendiente', 'tarjeta', 'Sin cebolla', NOW() - INTERVAL '12 minutes')
            RETURNING id INTO order_1;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_1, menu_item_ids[1], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[1];
            
            -- Pedido 2: Dos platos
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '115', 0, 'pendiente', 'habitacion', 'Poco condimento', NOW() - INTERVAL '9 minutes')
            RETURNING id INTO order_2;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_2, menu_item_ids[2], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[2];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_2, menu_item_ids[3], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[3];
            
            -- Pedido 3: Tres platos
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '308', 0, 'preparando', 'efectivo', 'Sin lactosa', NOW() - INTERVAL '6 minutes')
            RETURNING id INTO order_3;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_3, menu_item_ids[1], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[1];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_3, menu_item_ids[4], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[4];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_3, menu_item_ids[2], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[2];
            
            -- Pedido 4: Cuatro items (uno repetido)
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '421', 0, 'pendiente', 'habitacion', 'Extra salsa', NOW() - INTERVAL '4 minutes')
            RETURNING id INTO order_4;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_4, menu_item_ids[3], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[3];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_4, menu_item_ids[4], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[4];
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_4, menu_item_ids[1], 2, price, price * 2
            FROM menu_items WHERE id = menu_item_ids[1];
            
            -- Pedido 5: Un plato
            INSERT INTO orders (id, hotel_id, room_number, total, status, payment_method, special_instructions, created_at) 
            VALUES (gen_random_uuid(), target_hotel_id, '127', 0, 'completado', 'tarjeta', 'Bien caliente', NOW() - INTERVAL '2 minutes')
            RETURNING id INTO order_5;
            
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
            SELECT order_5, menu_item_ids[2], 1, price, price
            FROM menu_items WHERE id = menu_item_ids[2];
            
            -- Actualizar totales de todos los pedidos
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_1) WHERE id = order_1;
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_2) WHERE id = order_2;
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_3) WHERE id = order_3;
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_4) WHERE id = order_4;
            UPDATE orders SET total = (SELECT SUM(total_price) FROM order_items WHERE order_id = order_5) WHERE id = order_5;
            
            RAISE NOTICE 'Pedidos recreados correctamente con relaciones válidas';
        ELSE
            RAISE NOTICE 'No hay suficientes items en el menú';
        END IF;
    ELSE
        RAISE NOTICE 'No se encontró el hotel';
    END IF;
END $$;
