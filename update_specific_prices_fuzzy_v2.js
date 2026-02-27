const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updates = [
    { search: 'Futsal Adidas predator league negro-azul', price: 150000 },
    { search: 'Futsal Mizuno 2.0 blanco-azul', price: 170000 },
    { search: 'Futsal Mizuno 2.0 blanco-morado', price: 170000 },
    { search: 'Futsal Mizuno 2.0 blanco-fuchsia', price: 170000 },
    { search: 'Futsal Nike gato lunar Azul-blanco', price: 180000 },
    { search: 'Futsal Nike gato lunar azul-verde', price: 180000 },
    { search: 'Futsal Nike gato street beige suela goma', price: 180000 },
    { search: 'Futsal Nike gato agreste rojo-blanco', price: 180000 },
    { search: 'Futsal Magistax', price: 170000 },
    { search: 'Guayo phantom GX 2 morado-naranja', price: 250000 },
    { search: 'Futsal Nike Gato lunar blanco', price: 180000 },
    { search: 'Guayo predator elite FG BECKAM ROSA', price: 230000 },
    { search: 'Teni guayo F50 elite verde-blanco', price: 180000 },
    { search: 'Futsal NIKE GATO SUPREME FUCHSIA-AZUL', price: 130000 },
    { search: 'Teni guayo predator league Beckham rosa', price: 190000 },
    { search: 'Futsal Adidas crazyfast league amarillo neón', price: 160000 },
    { search: 'Teni guayo Adidas F50 pro TF Turf naranja', price: 180000 },
    { search: 'Teni guayo nike mercurial vapor 15 academy TF rosa', price: 180000 },
    { search: 'Teni guayo Adidas predator league rojo-blanco', price: 190000 },
    { search: 'Guayo Adidas predator le agüé azul-verde', price: 230000 },
    { search: 'Futsal Joma regate rebound verde-blanco', price: 180000 },
    { search: 'Teni guayo nike mercurial rosa multicolor niño', price: 180000 }
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
    console.log(`Total matched and updated: ${matchedIds.size} / ${updates.length}`);
}

runUpdates();
