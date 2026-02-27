const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTeniGuayos() {
    const { data: products, error } = await supabase.from('products').select('id, name, category');
    if (error) { console.error(error); return; }

    console.log('--- PRODUCTS WITH "TENI GUAYO" ---');
    products.filter(p => p.name.toLowerCase().includes('teni guayo')).forEach(p => {
        console.log(`ID: ${p.id} | Name: [${p.name}] | Cat: [${p.category}]`);
    });
}

listTeniGuayos();
