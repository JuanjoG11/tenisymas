
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const pricesMap = JSON.parse(fs.readFileSync('c:\\Users\\Juanjo\\Documents\\tenisymas\\prices_map_final.json', 'utf8'));

function getMatchScore(name1, name2) {
    const words1 = name1.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const words2 = name2.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);

    let matches = 0;
    words1.forEach(w => {
        if (words2.includes(w)) matches++;
    });

    return matches / Math.max(words1.length, words2.length, 1);
}

async function restorePrices() {
    console.log("🚀 Starting Price Restoration with Fuzzy Matching...");
    const { data: dbProds, error } = await supabase.from('products').select('*');
    if (error) return console.error(error);

    console.log(`Found ${dbProds.length} products in DB.`);
    let updatedCount = 0;

    for (const prod of dbProds) {
        let bestMatch = null;
        let highestScore = 0;

        for (const mapItem of pricesMap) {
            const score = getMatchScore(prod.name, mapItem.name);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = mapItem;
            }
        }

        // Only update if score is reasonable (e.g. > 0.3 overlap)
        if (bestMatch && highestScore > 0.3) {
            console.log(`Matching: [${(highestScore * 100).toFixed(0)}%] '${prod.name}' -> '${bestMatch.name}' ($${bestMatch.price})`);

            const { error: uError } = await supabase
                .from('products')
                .update({
                    price: bestMatch.price,
                    oldprice: bestMatch.oldPrice // Map to the lowercase column name
                })
                .eq('id', prod.id);

            if (uError) {
                console.error(`Error updating ID ${prod.id}:`, uError.message);
            } else {
                updatedCount++;
            }
        } else {
            console.log(`No good match for: '${prod.name}' (Best was ${(highestScore * 100).toFixed(0)}%)`);
        }
    }

    console.log(`\n✅ Finished! Successfully updated ${updatedCount} products.`);
}

restorePrices();
