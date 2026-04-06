const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .limit(5);
    
    if (error) {
        console.error("Error fetching products:", error.code, error.message);
        return;
    }
    
    console.log(`Found ${products.length} products:`);
    products.forEach(p => console.log(`- ${p.name}`));
}
checkProducts();
