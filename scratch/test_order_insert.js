const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
    console.log("Attempting test insert into 'orders'...");
    
    const testOrder = {
        customer_info: { firstName: "Test", lastName: "User", phone: "123", email: "test@example.com", address: "Calle 1", city: "Bogota" },
        items: [{ name: "Test Product", quantity: 1, price: 50000 }],
        total: 50000,
        payment_method: 'test',
        status: 'pending',
        external_reference: 'TEST-' + Date.now()
    };

    const { data, error } = await supabase.from('orders').insert([testOrder]).select();

    if (error) {
        console.error("Insert FAILED:", error.message);
        console.error("Details:", error.details);
    } else {
        console.log("Insert SUCCESS!");
        console.log("Inserted ID:", data[0].id);
        
        // Clean up
        // await supabase.from('orders').delete().eq('id', data[0].id);
    }
}

testInsert();
