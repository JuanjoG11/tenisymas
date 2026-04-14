const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function recoverDarioOrder() {
    console.log("Rescuing Dario Solano's order...");
    
    const darioOrder = {
        customer_info: { 
            firstName: "Dario", 
            lastName: "Solano (RECUPERADO)", 
            phone: "Ver en Mercado Pago", 
            email: "dasg8@hotmail.com", 
            address: "Pendiente", 
            city: "Pendiente" 
        },
        items: [{ name: "PRODUCTOS: Ver actividad Mercado Pago (Ref: 153878235453)", quantity: 1, price: 196500 }],
        total: 196500,
        payment_method: 'mercadopago',
        status: 'pending',
        status_payment: 'approved',
        external_reference: '153878235453', // El ID de operacion que vimos en la foto
        paid_at: '2026-04-13T12:00:00Z'
    };

    const { data, error } = await supabase.from('orders').insert([darioOrder]).select();

    if (error) {
        console.error("Rescue FAILED:", error.message);
    } else {
        console.log("Rescue SUCCESS! Order ID:", data[0].id);
    }
}

recoverDarioOrder();
