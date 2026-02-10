-- Script para actualizar precios de petos y camisetas según solicitud del usuario

-- Actualizar precios para la categoría 'petos'
UPDATE products 
SET price = '$65.000' 
WHERE category = 'petos';

-- Actualizar precios para la categoría 'camisetas'
UPDATE products 
SET price = '$75.000' 
WHERE category = 'camisetas';

-- Verificar cambios
SELECT id, name, category, price 
FROM products 
WHERE category IN ('petos', 'camisetas');
