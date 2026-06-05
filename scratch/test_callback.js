// Script to directly call the Supabase addi-callback function and simulate an APPROVED callback
// to test that Telegram notification is working end-to-end.

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';

const payload = {
    // Simulate what Addi sends to the callback
    orderId: "TM-1780533483883", // External reference of the Maria Fernanda order
    status: "APPROVED"
};

async function testCallback() {
    console.log("Sending simulated callback to addi-callback function...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const res = await fetch('https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/addi-callback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY
        },
        body: JSON.stringify(payload)
    });

    const status = res.status;
    const text = await res.text();
    console.log(`\nResponse status: ${status}`);
    console.log(`Response body: ${text}`);
}

testCallback();
