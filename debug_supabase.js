
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findPriceColumns() {
    console.log("Searching all tables for 'price' or 'precio' columns...");
    // Using RPC or raw query if possible. The anon key might not have access to information_schema directly.
    // Let's try querying a view or just getting all tables if there's a way.
    // Usually anon key cannot query information_schema, but we can try.

    // Actually, I can query a large list of guessed table names.
    const guesses = [
        'products_backup', 'products_old', 'products_v1', 'products_v2', 'productos',
        'old_products', 'backup_products', 'inventory_old', 'inventory_backup',
        'historical_prices', 'price_history', 'product_details', 'items'
    ];

    for (const table of guesses) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`FOUND TABLE: ${table}`);
            console.log(`COLUMNS: ${Object.keys(data[0] || {}).join(', ')}`);
        }
    }
    console.log("Done checking guesses.");
}

findPriceColumns();
