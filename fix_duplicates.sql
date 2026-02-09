-- Script para eliminar el producto duplicado "Colección petos 2"
-- Primero identificamos cuál es el incorrecto (posiblemente el que tiene ID más reciente o el que no tiene imagen de portada)

-- 1. Verificación previa (opcional, para que veas los duplicados)
SELECT id, name, images FROM products WHERE name = 'Colección petos 2';

-- 2. Eliminar el producto duplicado
-- Vamos a eliminar el producto "Colección petos 2" que NO tiene la imagen de portada correcta
-- O simplemente eliminaremos TODOS los "Colección petos 2" para que vuelvas a insertar SOLO UNO correctamente
DELETE FROM products WHERE name = 'Colección petos 2';

-- 3. Volver a insertar el producto CORRECTO (una sola vez)
INSERT INTO products (name, category, price, image, sizes, colors, images)
VALUES (
    'Colección petos 2',          -- Nombre
    'petos',                      -- Categoría
    '$150.000',                   -- Precio
    'images/petos2_portada.jpg.jpeg',  -- Imagen Principal
    '["S", "M", "L", "XL"]'::jsonb, -- Tallas
    '["BLANCO-AZUL", "NEGRO", "BLANCO-VERDE"]'::jsonb, -- Colores
    jsonb_build_array(
        'images/petos2_portada.jpg.jpeg',             
        'images/petos2_blanco_azul_frente.jpg.jpeg',  
        'images/petos2_blanco_azul_atras.jpg.jpeg',   
        'images/petos2_negro_verde.jpg.jpeg',         
        'images/petos2_comparacion.jpg.jpeg'          
    )
);

-- 4. Verificación final
SELECT * FROM products WHERE name = 'Colección petos 2';
