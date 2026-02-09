-- Script para agregar la columna 'images' a la tabla 'products'
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Agregar la columna 'images' como JSONB (puede almacenar arrays de URLs)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images jsonb;

-- 2. Primero, vamos a ver qué imagen tiene actualmente el producto
SELECT id, name, image FROM products WHERE id = 84;

-- 3. Actualizar el producto "Colección petos 1" con las 3 imágenes
UPDATE products 
SET images = jsonb_build_array(
    image,  -- Usa la imagen actual como primera imagen (images/uniformes-main.png)
    'images/collecionpeto1.1.jpeg',  -- Segunda imagen
    'images/collecionpeto1.2.jpeg'   -- Tercera imagen
)
WHERE id = 84;

-- 4. Verificar que se aplicó correctamente
SELECT id, name, category, price, sizes, colors, image, images 
FROM products 
WHERE id = 84;
