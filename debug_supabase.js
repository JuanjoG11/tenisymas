
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyColumns() {
    try {
        const { data, error } = await supabase.from('products').select('*').limit(1);
        if (error) throw error;
        if (data && data.length > 0) {
            console.log("VERIFIED_COLUMNS:" + Object.keys(data[0]).join(', '));
        } else {
            console.log("No products found to verify columns.");
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
verifyColumns();
