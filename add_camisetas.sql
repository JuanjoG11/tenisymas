-- Script para agregar el producto "Colección Camisetas"
-- Ejecuta este script en el SQL Editor de Supabase

INSERT INTO products (name, category, price, image, sizes, colors, images)
VALUES (
    'Colección Camisetas',        -- Nombre
    'camisetas',                  -- Categoría (Aparecerá junto con Petos)
    '$150.000',                   -- Precio (Igual que petos)
    'images/camisetas_portada.jpg', -- Imagen Principal
    '["S", "M", "L", "XL"]'::jsonb, -- Tallas
    '["BLANCO-AZUL", "NEGRO", "BLANCO-VERDE"]'::jsonb, -- Colores
    
    -- Array de 5 imágenes para el carrusel
    jsonb_build_array(
        'images/camisetas_portada.jpg', -- Foto 1 (Portada)
        'images/camisetas_foto1.jpg',   -- Foto 2
        'images/camisetas_foto2.jpg',   -- Foto 3
        'images/camisetas_foto3.jpg',   -- Foto 4
        'images/camisetas_foto4.jpg'    -- Foto 5
    )
);

-- Verificar inserción
SELECT * FROM products WHERE name = 'Colección Camisetas';
