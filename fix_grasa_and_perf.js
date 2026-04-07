// fix_grasa_and_perf.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fix() {
    console.log('🚀 Corrigiendo foto de La Grasa...');
    const { error } = await supabase
        .from('products')
        .update({ 
            image: 'images/camisetas_portada.jpg.jpeg',
            images: [
                'images/camisetas_portada.jpg.jpeg',
                'images/camisetas_foto1.jpg.jpeg',
                'images/camisetas_foto2.jpg.jpeg',
                'images/camisetas_foto3.jpg.jpeg',
                'images/camisetas_foto4.jpg.jpeg'
            ]
        })
        .ilike('name', '%Grasa%');

    if (error) console.error('❌ Error La Grasa:', error.message);
    else console.log('✅ Foto de La Grasa corregida.');
}

fix();
