-- Script para agregar la columna 'sizes' a la tabla 'products'
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Agregar la columna 'sizes' como JSONB (puede almacenar arrays)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sizes jsonb;

-- 2. Actualizar el producto "Colección petos 1" con las tallas
UPDATE products 
SET sizes = '["S", "M", "L", "XL"]'::jsonb,
    name = 'Colección petos 1'
WHERE id = 84;

-- 3. Verificar que se aplicó correctamente
SELECT id, name, category, price, sizes 
FROM products 
WHERE id = 84;
