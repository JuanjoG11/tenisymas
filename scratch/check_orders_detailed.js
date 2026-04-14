const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRecentOrders() {
    console.log("Fetching last 10 orders...");
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching orders:", error.message);
        return;
    }

    if (data.length === 0) {
        console.log("No orders found in 'orders' table.");
    } else {
        console.log(`Found ${data.length} orders:`);
        data.forEach(order => {
            console.log(`ID: ${order.id}, Ref: ${order.external_reference}, Created: ${order.created_at}, Method: ${order.payment_method}, Status: ${order.status}, Total: ${order.total}`);
        });
    }
}

checkRecentOrders();
