const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ACCESS_TOKEN = "APP_USR-8626270631469210-022013-797bdb9a76a3d85b866049fb85eb4e38-3213704453";
const PAYMENT_ID = "159848093626";

const TELEGRAM_TOKEN = "8751458666:AAEEFXichBYpwLh2f86aaozkXZ8sGpnnhJw";
const TELEGRAM_CHAT_ID = "7501484183";

async function sendTelegram(msg) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" })
        });
        console.log("Telegram notification sent successfully!");
    } catch (e) {
        console.error("Telegram error:", e);
    }
}

async function rescueOrder() {
    try {
        console.log(`Rescuing payment ${PAYMENT_ID}...`);
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${PAYMENT_ID}`, {
            headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
        });
        
        if (!mpRes.ok) {
            console.error("Failed to fetch payment from Mercado Pago:", mpRes.status, await mpRes.text());
            return;
        }
        
        const paymentData = await mpRes.json();
        const status = paymentData.status;
        const metadata = paymentData.metadata;
        
        console.log("Payment status:", status);
        
        if (status === 'approved' && metadata) {
            const orderData = {
                external_reference: paymentData.external_reference,
                customer_info: metadata.customer,
                items: metadata.items,
                total: paymentData.transaction_amount,
                payment_method: 'mercadopago',
                status: 'pending', // Pendiente de despacho
                status_payment: 'approved',
                paid_at: new Date(paymentData.date_approved || paymentData.date_created).toISOString()
            };
            
            console.log("Inserting order into Supabase...");
            const { data, error } = await supabase.from('orders').insert([orderData]).select();
            
            if (error) {
                console.error("Error inserting order into Supabase:", error);
                return;
            }
            
            console.log("✅ Order successfully created in DB!");
            
            // Support both snake_case (returned by MP) and camelCase
            const customer = metadata.customer || {};
            const firstName = customer.firstName || customer.first_name || 'N/A';
            const lastName = customer.lastName || customer.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            const msg = `✅ *¡NUEVA VENTA CONFIRMADA!*\n\n💰 *Monto:* $${paymentData.transaction_amount.toLocaleString('es-CO')}\n👤 *Cliente:* ${fullName}\n📦 *Orden:* ${paymentData.external_reference}\n\n_El pedido ya aparece en tu panel de administración._`;
            await sendTelegram(msg);
        } else {
            console.log("Payment is not approved or has no metadata.");
        }
    } catch (e) {
        console.error("Rescue failed:", e);
    }
}

rescueOrder();
