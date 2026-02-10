-- Script para renombrar colecciones y actualizar precios (Feb 09 - Jerga Colombiana)

-- 1. Actualizar Petos 1 -> Los Calidosos ($65.000)
UPDATE products 
SET name = 'Colección Los Calidosos', price = '$65.000' 
WHERE name = 'Colección petos 1' OR (category = 'petos' AND name LIKE '%1%');

-- 2. Actualizar Petos 2 -> La Pesada ($65.000)
UPDATE products 
SET name = 'Colección La Pesada', price = '$65.000' 
WHERE name = 'Colección petos 2' OR (category = 'petos' AND name LIKE '%2%');

-- 3. Actualizar Camisetas -> La Grasa ($75.000)
UPDATE products 
SET name = 'Colección La Grasa', price = '$75.000' 
WHERE category = 'camisetas';

-- 4. Asegurar que todos los demás petos tengan el precio correcto
UPDATE products 
SET price = '$65.000' 
WHERE category = 'petos';

-- Verificar cambios
SELECT id, name, category, price 
FROM products 
WHERE category IN ('petos', 'camisetas')
ORDER BY category, name;
