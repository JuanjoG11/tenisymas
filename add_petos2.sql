-- Script para agregar el producto "Colección La Pesada" (Anteriormente Petos 2)
-- Ejecuta este script en el SQL Editor de Supabase

INSERT INTO products (name, category, price, image, sizes, colors, images)
VALUES (
    'Colección La Pesada',          -- Nombre
    'petos',                      -- Categoría
    '$65.000',                   -- Precio
    'images/petos2_portada.jpg.jpeg',  -- Imagen Principal
    '["S", "M", "L", "XL"]'::jsonb, -- Tallas
    '["BLANCO-AZUL", "NEGRO", "BLANCO-VERDE"]'::jsonb, -- Colores
    
    -- Array de imágenes param el carrusel
    jsonb_build_array(
        'images/petos2_portada.jpg.jpeg',             -- Portada
        'images/petos2_blanco_azul_frente.jpg.jpeg',  -- Blanco-Azul Frente
        'images/petos2_blanco_azul_atras.jpg.jpeg',   -- Blanco-Azul Atras
        'images/petos2_negro_verde.jpg.jpeg',         -- Negro-Verde
        'images/petos2_comparacion.jpg.jpeg'          -- Comparación
    )
);

-- Verificar inserción
SELECT * FROM products WHERE name = 'Colección La Pesada';
