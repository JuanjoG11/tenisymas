const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkOrdersColumns() {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
        console.error('Error fetching orders:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in orders table:', Object.keys(data[0]));
        console.log('Sample data:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No orders found to check columns.');
    }
}
checkOrdersColumns();
