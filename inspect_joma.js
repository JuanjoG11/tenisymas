const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkJoma() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*');
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    const jomas = products.filter(p => 
        (p.name || '').toLowerCase().includes('joma') || 
        (p.brand || '').toLowerCase().includes('joma') ||
        (p.marca || '').toLowerCase().includes('joma')
    );
    
    console.log(`Total Products: ${products.length}`);
    console.log(`Joma found: ${jomas.length}`);
    if (jomas.length > 0) {
        jomas.slice(0, 5).forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.name}, Brand: ${p.brand}, Marca: ${p.marca}, Category: ${p.category}`);
        });
    }
}
checkJoma();
