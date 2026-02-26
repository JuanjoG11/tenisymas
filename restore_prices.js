
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getPricesMap() {
    const raw = fs.readFileSync('c:\\Users\\Juanjo\\Documents\\tenisymas\\prices_map_final.json');
    // Try to remove BOM and handle potential UTF-16 from PowerShell >
    let content = raw.toString('utf16le');
    if (!content.trim().startsWith('[')) {
        content = raw.toString('utf8').replace(/^\uFEFF/, '');
    }
    return JSON.parse(content);
}

const pricesMap = getPricesMap();

async function restorePrices() {
    console.log("🚀 Starting Price Restoration...");
    const { data: products, error: pError } = await supabase.from('products').select('*');
    if (pError) {
        console.error("Error fetching products:", pError);
        return;
    }

    console.log(`Found ${products.length} products in DB.`);
    let updatedCount = 0;
    for (const prod of products) {
        const match = pricesMap.find(m => m.name.toLowerCase().trim() === prod.name.toLowerCase().trim());
        if (match) {
            console.log(`Matching: ${prod.name} -> ${match.price}`);
            const { error: uError } = await supabase
                .from('products')
                .update({
                    price: match.price,
                    oldPrice: match.oldPrice
                })
                .eq('id', prod.id);

            if (uError) {
                console.error(`Error updating ${prod.name}:`, uError.message);
                if (uError.message.includes('column "price"')) {
                    console.log("STOPPING: Columns are definitely missing.");
                    return;
                }
            } else {
                updatedCount++;
            }
        }
    }
    console.log(`\n✅ Finished! Successfully updated ${updatedCount} products.`);
}

restorePrices();
