const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fix() {
    const { data: allProducts, error } = await supabase.from('products').select('id, name, category');
    if (error) { console.error(error); return; }

    const toFix = allProducts.filter(p =>
        p.name.toLowerCase().includes('teni guayo') && p.category === 'guayos'
    );

    console.log(`Found ${toFix.length} products to fix.`);

    for (const p of toFix) {
        const { error: updErr } = await supabase
            .from('products')
            .update({ category: 'tenis-guayos' })
            .eq('id', p.id);

        if (updErr) {
            console.error(`Error fixing ${p.name}:`, updErr.message);
        } else {
            console.log(`✅ Moved to tenis-guayos: ${p.name}`);
        }
    }
}

fix();
