
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        console.error(error);
        return;
    }

    const base64Main = data.filter(p => p.image && p.image.includes('data:image')).length;
    const base64Gallery = data.filter(p => {
        let gallery = p.images || [];
        if (typeof gallery === 'string' && gallery.startsWith('[')) {
            try { gallery = JSON.parse(gallery); } catch(e) {}
        }
        return Array.isArray(gallery) && gallery.some(img => img && img.includes('data:image'));
    }).length;

    console.log(`TOTAL PRODUCTS: ${data.length}`);
    console.log(`BASE64 MAIN: ${base64Main}`);
    console.log(`BASE64 GALLERY: ${base64Gallery}`);
}

check();
