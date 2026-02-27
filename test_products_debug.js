const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        const nullPrices = data.filter(p => !p.price);
        console.log(`Total products: ${data.length}`);
        console.log(`Products with null price: ${nullPrices.length}`);
        if (data.length > 0) {
            console.log("First product:", JSON.stringify(data[0], null, 2));
        }
    }
}
test();
