// restore_petos_data.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PETOS_DATA = [
    {
        name: 'Colección Los Calidosos',
        price: '$65.000',
        image: 'images/uniformes-main.png',
        category: 'Petos y Camisetas',
        images: ['images/uniformes-main.png', 'images/collecionpeto1.1.jpeg', 'images/collecionpeto1.2.jpeg']
    },
    {
        name: 'Colección La Pesada',
        price: '$65.000',
        image: 'images/petos2_portada.jpg.jpeg',
        category: 'Petos y Camisetas',
        images: ['images/petos2_portada.jpg.jpeg', 'images/petos2_blanco_azul_frente.jpg.jpeg', 'images/petos2_blanco_azul_atras.jpg.jpeg', 'images/petos2_negro_verde.jpg.jpeg', 'images/petos2_comparacion.jpg.jpeg']
    },
    {
        name: 'Colección La Grasa',
        price: '$65.000',
        image: 'images/petos3_grasa_portada.jpg.jpeg',
        category: 'Petos y Camisetas'
    }
];

async function fix() {
    console.log('🚀 Restaurando fotos y precios de Petos y Camisetas...');
    
    for (const item of PETOS_DATA) {
        const { data, error } = await supabase
            .from('products')
            .update({ 
                price: item.price, 
                image: item.image,
                category: item.category,
                images: item.images || []
            })
            .ilike('name', `%${item.name}%`);

        if (error) {
            console.error(`❌ Error con ${item.name}:`, error.message);
        } else {
            console.log(`✅ ${item.name} restaurado correctamente.`);
        }
    }
    console.log('\n✨ ¡Listo! Revisa la página ahora.');
}

fix();
