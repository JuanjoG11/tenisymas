const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixCategories() {
    const { data: products, error } = await supabase.from('products').select('id, name, category');
    if (error) { console.error(error); return; }

    const targets = products.filter(p => {
        const name = p.name.toLowerCase();
        return name.includes('teni guayo') && p.category === 'guayos';
    });

    console.log(`Fixing ${targets.length} products...`);

    for (const p of targets) {
        const { error: updateError } = await supabase
            .from('products')
            .update({ category: 'tenis-guayos' })
            .eq('id', p.id);

        if (updateError) {
            console.error(`Error fixing ${p.name}:`, updateError.message);
        } else {
            console.log(`✅ Fixed: ${p.name}`);
        }
    }
}

fixCategories();
