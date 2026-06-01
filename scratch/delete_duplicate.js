const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deleteDuplicate() {
    console.log("Deleting duplicate order...");
    const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', '4f6ee41b-490b-407f-926a-e6f66a2a5cc4')
        .select();

    if (error) {
        console.error("Error deleting duplicate order:", error);
    } else {
        console.log("Deleted successfully:", data);
    }
}

deleteDuplicate();
