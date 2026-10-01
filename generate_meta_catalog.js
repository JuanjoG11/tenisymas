/**
 * GENERADOR DE CATÁLOGO PARA META ADS (FACEBOOK & INSTAGRAM COMMERCE)
 * Exporta el inventario de Supabase a formato CSV estándar de Meta Commerce Manager.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE_STORE_URL = 'https://tennisymas.co'; // Cambiar si es diferente

async function generateCatalog() {
    console.log('🔄 Consultando productos desde Supabase...');
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error al consultar Supabase:', error);
        return;
    }

    console.log(`📦 Se encontraron ${products.length} productos.`);

    // Columnas requeridas por Meta Commerce Manager
    // id,title,description,availability,condition,price,link,image_link,brand,google_product_category
    const headers = [
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'link',
        'image_link',
        'brand',
        'google_product_category'
    ];

    const rows = products.map(p => {
        const id = String(p.id || '').trim();
        const title = `"${(p.name || 'Calzado Deportivo').replace(/"/g, '""').trim()}"`;
        
        let desc = p.description || p.descripcion || `${p.name} - Calzado deportivo de alta calidad con garantía y envío seguro en Colombia.`;
        desc = `"${desc.replace(/"/g, '""').replace(/[\r\n]+/g, ' ').trim()}"`;

        const availability = 'in stock';
        const condition = 'new';

        // Precios
        let numPrice = 0;
        if (typeof p.price === 'number') numPrice = p.price;
        else if (p.price) numPrice = parseInt(String(p.price).replace(/\D/g, '')) || 0;
        else if (p.precio) numPrice = parseInt(String(p.precio).replace(/\D/g, '')) || 0;
        
        const price = `"${numPrice} COP"`;

        // Link
        const link = `"${BASE_STORE_URL}/collections.html?product=${p.id}"`;
        
        // Image
        let imgUrl = p.image;
        if (!imgUrl && Array.isArray(p.images) && p.images.length > 0) imgUrl = p.images[0];
        const image_link = `"${imgUrl || ''}"`;

        // Brand
        let brand = p.brand || p.marca || '';
        if (!brand) {
            const nameLower = (p.name || '').toLowerCase();
            if (nameLower.includes('joma')) brand = 'Joma';
            else if (nameLower.includes('nike')) brand = 'Nike';
            else if (nameLower.includes('adidas')) brand = 'Adidas';
            else if (nameLower.includes('puma')) brand = 'Puma';
            else if (nameLower.includes('max')) brand = 'Max Sport';
            else if (nameLower.includes('saprix')) brand = 'Saprix';
            else brand = 'Tennis y Más';
        }
        brand = `"${brand.replace(/"/g, '""')}"`;

        const google_category = '"Sporting Goods > Athletic Shoes"';

        return [
            id,
            title,
            desc,
            availability,
            condition,
            price,
            link,
            image_link,
            brand,
            google_category
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const outputPath = path.join(__dirname, 'meta_catalog.csv');
    fs.writeFileSync(outputPath, '\ufeff' + csvContent, 'utf8'); // con BOM para compatibilidad Excel/Meta

    console.log(`✅ Catálogo generado con éxito en: ${outputPath}`);
    console.log(`🎯 Listo para subir a: Meta Commerce Manager -> Catálogos -> Fuentes de datos -> Subir archivo`);
}

generateCatalog();
