const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findDanielPedrazaOrder() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    const order = orders.find(o => 
        o.customer_info && 
        o.customer_info.firstName && 
        o.customer_info.firstName.toLowerCase().includes('daniel') && 
        o.customer_info.lastName && 
        o.customer_info.lastName.toLowerCase().includes('pedraza')
    );
    
    if (order) {
        console.log("Order found:");
        console.log(JSON.stringify(order, null, 2));
    } else {
        console.log("Order not found.");
    }
}
findDanielPedrazaOrder();
