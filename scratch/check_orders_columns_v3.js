const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkColumns() {
    const testRow = {
        customer_info: { test: true },
        items: [],
        total: 0,
        payment_method: 'test',
        status: 'pending',
        status_payment: 'approved',
        paid_at: new Date().toISOString(),
        stock_processed: false
    };
    
    const { data, error } = await supabase.from('orders').insert([testRow]).select();
    if (error) {
        console.error('Error:', error.message);
        console.error('Details:', error.details);
    } else {
        console.log('Insert SUCCESS!');
        console.log('Columns found:', Object.keys(data[0]));
        await supabase.from('orders').delete().eq('id', data[0].id);
    }
}
checkColumns();
