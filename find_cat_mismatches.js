const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findMismatches() {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) { console.error(error); return; }

    const mismatches = products.filter(p => {
        const name = p.name.toLowerCase();
        const category = p.category ? p.category.toLowerCase() : '';
        // "teni guayo" should probably be in "tenis-guayos" (TF/Turf) not in "guayos" (FG/Elite)
        return name.includes('teni guayo') && category === 'guayos';
    });

    console.log(`Found ${mismatches.length} mismatches:`);
    mismatches.forEach(m => console.log(`ID: ${m.id} | Name: ${m.name} | Cat: ${m.category}`));
}
findMismatches();
