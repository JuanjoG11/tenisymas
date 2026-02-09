-- Script para agregar la columna 'colors' a la tabla 'products'
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Agregar la columna 'colors' como JSONB (puede almacenar arrays)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS colors jsonb;

-- 2. Actualizar el producto "Colección petos 1" con los colores
UPDATE products 
SET colors = '["NEGRO", "MORADO", "ROJO"]'::jsonb
WHERE id = 84;

-- 3. Verificar que se aplicó correctamente
SELECT id, name, category, price, sizes, colors 
FROM products 
WHERE id = 84;
