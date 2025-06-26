
-- Limpiar todas las tablas relacionadas con pedidos y menús
-- Primero eliminamos los items de pedidos (por las foreign keys)
DELETE FROM order_items;

-- Luego eliminamos los pedidos archivados
DELETE FROM archived_orders;

-- Eliminamos todos los pedidos
DELETE FROM orders;

-- Eliminamos todos los items del menú
DELETE FROM menu_items;

-- Eliminamos todas las categorías del menú
DELETE FROM menu_categories;
