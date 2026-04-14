const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkOrdersTable() {
    console.log("Checking structure of 'orders' table...");
    // Since it's empty, we might not get columns from data[0].
    // We can try to insert a dummy row (and then delete it) to see if it fails or what columns it expects.
    // Or we can try to get the schema if possible, but let's try a dry-run insert.
    
    const { data: cols, error: schemaError } = await supabase.rpc('get_table_columns', { table_name: 'orders' });
    if (schemaError) {
        console.log("RPC get_table_columns failed (expected if not defined). Trying alternative...");
        // Try to insert an empty object to see the error message which might contain column info
        const { error: insError } = await supabase.from('orders').insert({}).select();
        if (insError) {
            console.log("Insert failed as expected. Error message:", insError.message);
            console.log("Error details:", insError.details);
            console.log("Error hint:", insError.hint);
        }
    } else {
        console.log("Columns:", cols);
    }
}

checkOrdersTable();
