const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findMatch() {
    const targetPrice = 180000;
    console.log(`Searching for products with price $180.000...`);
    
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    const matches = products.filter(p => {
        const pPrice = parseInt(p.price.replace(/[^0-9]/g, '')) || 0;
        return pPrice === targetPrice;
    });

    if (matches.length === 0) {
        console.log("No exact $180.000 matches.");
    } else {
        console.log(`Found ${matches.length} candidates:`);
        matches.forEach(p => console.log(`- ${p.name} (${p.category})` || "N/A"));
    }
}

findMatch();
