const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
    console.log("Checking products...");
    const { count: productCount, error: pError } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (pError) console.error("Error products:", pError.message);
    else console.log("Product count:", productCount);

    console.log("Checking orders...");
    const { count: orderCount, error: oError } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    if (oError) console.error("Error orders:", oError.message);
    else console.log("Order count:", orderCount);
}

checkTables();
