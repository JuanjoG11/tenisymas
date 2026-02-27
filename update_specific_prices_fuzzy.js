const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updates = [
    { search: 'Teni guayo F50 blanco rojo niño', price: 180000 },
    { search: 'Teni guayo nike mercurial amarillo niño', price: 180000 },
    { search: 'Teni guayo Adidas F50 tubular league lamine yamal morado-rosa', price: 180000 },
    { search: 'Guayo nike phantom GX 2 negro verde menta', price: 250000 },
    { search: 'Futsal gato lunar morado', price: 180000 },
    { search: 'Futsal Nike gato supreme fuchsia', price: 150000 },
    { search: 'Teni guayo lamine yamal morado rosa', price: 180000 },
    { search: 'Futsal joma top-flex rebound negro verde menta', price: 180000 },
    { search: 'Futsal nike gato supremo negro chulo azul', price: 150000 },
    { search: 'Guayo nike hypervenom 1 RGN hydra blanco azul', price: 170000 },
    { search: 'Teni guayo F50 league tubular blanco rojo', price: 180000 }
];

function formatPrice(num) {
    return '$' + new Intl.NumberFormat('es-CO').format(num);
}

function normalize(s) {
    return s.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function runUpdates() {
    const { data: dbProducts, error } = await supabase.from('products').select('*');
    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    const matchedIds = new Set();

    for (const update of updates) {
        let bestMatch = null;
        let highestScore = 0;
        const searchNorm = normalize(update.search);
        const searchWords = searchNorm.split(' ');

        for (const p of dbProducts) {
            const dbNorm = normalize(p.name);
            const dbWords = dbNorm.split(' ');

            // Calculate intersection score
            let score = 0;
            searchWords.forEach(w => { if (dbWords.includes(w)) score++; });

            if (score > highestScore) {
                highestScore = score;
                bestMatch = p;
            }
        }

        if (bestMatch && highestScore >= 2) {
            const newPrice = formatPrice(update.price);
            const oldPrice = formatPrice(update.price + 35000);

            console.log(`✅ MATCH [Score ${highestScore}]: "${update.search}" matches "${bestMatch.name}"`);

            const { error: updateError } = await supabase
                .from('products')
                .update({ price: newPrice, oldprice: oldPrice })
                .eq('id', bestMatch.id);

            if (!updateError) matchedIds.add(bestMatch.id);
        } else {
            console.log(`❌ NO MATCH for "${update.search}"`);
        }
    }
    console.log(`Total matched and updated: ${matchedIds.size}`);
}

runUpdates();
