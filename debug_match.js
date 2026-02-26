
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const pricesMap = JSON.parse(fs.readFileSync('c:\\Users\\Juanjo\\Documents\\tenisymas\\prices_map_final.json', 'utf8'));

async function debugMatch() {
    const { data: dbProds } = await supabase.from('products').select('name');
    console.log("--- DB NAMES ---");
    dbProds.slice(0, 10).forEach(p => console.log(`'${p.name}'`));

    console.log("\n--- MAP NAMES ---");
    pricesMap.slice(0, 10).forEach(p => console.log(`'${p.name}'`));
}
debugMatch();
