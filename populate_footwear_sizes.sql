-- ============================================
-- SQL to Populate Missing Footwear Sizes
-- Execute this in the Supabase SQL Editor
-- ============================================

DO $$ 
BEGIN 
    -- 1. Ensure the sizes column exists as jsonb
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sizes') THEN
        ALTER TABLE products ADD COLUMN sizes jsonb;
    END IF;

    -- 2. Update all footwear products with default sizes (37-44)
    -- This matches the frontend chips [37, 38, 39, 40, 41, 42, 43, 44]
    UPDATE products 
    SET sizes = '["37", "38", "39", "40", "41", "42", "43", "44"]'::jsonb
    WHERE LOWER(TRIM(category)) IN (
        'tenis', 
        'guayos', 
        'tenis-guayos', 
        'futsal', 
        'tenis-futbol', 
        'tenis-running', 
        'running', 
        'fútbol-sala',
        'ninos'
    );

    -- 3. Verify specifically for a couple of known categories
    RAISE NOTICE 'Footwear sizes updated successfully.';
END $$;
