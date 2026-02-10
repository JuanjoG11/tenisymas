-- Script para agregar el producto "Colección La Grasa" (Anteriormente Camisetas)
-- Ejecuta este script en el SQL Editor de Supabase

INSERT INTO products (name, category, price, image, sizes, colors, images)
VALUES (
    'Colección La Grasa',        -- Nombre
    'camisetas',                  -- Categoría (Aparecerá junto con Petos)
    '$75.000',                   -- Precio (Igual que petos)
    'images/camisetas_portada.jpg', -- Imagen Principal
    '["S", "M", "L", "XL"]'::jsonb, -- Tallas
    '["BLANCO-AZUL", "NEGRO", "BLANCO-VERDE"]'::jsonb, -- Colores
    
    -- Array de 5 imágenes para el carrusel
    jsonb_build_array(
        'images/camisetas_portada.jpg.jpeg', -- Foto 1 (Portada)
        'images/camisetas_foto1.jpg.jpeg',   -- Foto 2
        'images/camisetas_foto2.jpg.jpeg',   -- Foto 3
        'images/camisetas_foto3.jpg.jpeg',   -- Foto 4
        'images/camisetas_foto4.jpg.jpeg'    -- Foto 5
    )
);

-- Verificar inserción
SELECT * FROM products WHERE name = 'Colección La Grasa';
