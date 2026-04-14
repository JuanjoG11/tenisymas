const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkColumns() {
    // We try to insert something with ONLY customer_info to see if it works and what columns we get back
    const { data, error } = await supabase.from('orders').insert([{ customer_info: {} }]).select();
    if (error) {
        console.error('Error:', error.message);
        console.error('Details:', error.details);
    } else {
        console.log('Columns in orders table:', Object.keys(data[0]));
        // Clean up
        await supabase.from('orders').delete().eq('id', data[0].id);
    }
}
checkColumns();
