const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAddiOrders() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_method', 'addi')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error("Error fetching Addi orders:", error.code, error.message);
        return;
    }
    
    if (!orders || orders.length === 0) {
        console.log("No Addi orders found.");
    } else {
        console.log(`Found ${orders.length} recent Addi orders:`);
        orders.forEach(o => {
            console.log(`- ID: ${o.id}, Status: ${o.status}, Status Payment: ${o.status_payment}, Created At: ${o.created_at}`);
        });
    }
}
checkAddiOrders();
