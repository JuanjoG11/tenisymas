import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_TOKEN = "8751458666:AAEEFXichBYpwLh2f86aaozkXZ8sGpnnhJw";
const TELEGRAM_CHAT_ID = "7501484183";

async function sendTelegram(msg: string) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" })
        });
    } catch (e) {}
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const url = new URL(req.url)
        const id = url.searchParams.get("id") || url.searchParams.get("data.id")
        const topic = url.searchParams.get("topic") || url.searchParams.get("type")

        if (topic === 'payment' && id) {
            const ACCESS_TOKEN = "APP_USR-8626270631469210-022013-797bdb9a76a3d85b866049fb85eb4e38-3213704453";
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
            const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
            })

            if (mpRes.ok) {
                const paymentData = await mpRes.json()
                const status = paymentData.status
                const metadata = paymentData.metadata

                // SOLO SI EL PAGO ESTÁ APROBADO, CREAMOS LA ORDEN EN LA DB
                if (status === 'approved' && metadata && SUPABASE_URL && SERVICE_ROLE) {
                    
                    const orderData = {
                        external_reference: paymentData.external_reference,
                        customer_info: metadata.customer,
                        items: metadata.items,
                        total: paymentData.transaction_amount,
                        payment_method: 'mercadopago',
                        status: 'pending', // Pendiente de despacho
                        status_payment: 'approved',
                        paid_at: new Date().toISOString()
                    }

                    // Insertar en la tabla de órdenes
                    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${SERVICE_ROLE}`,
                            "apikey": SERVICE_ROLE,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(orderData)
                    })

                    if (dbRes.ok) {
                        console.log("✅ ORDEN CREADA TRAS PAGO EXITOSO");
                        const msg = `✅ *¡NUEVA VENTA CONFIRMADA!*\n\n💰 *Monto:* $${paymentData.transaction_amount.toLocaleString('es-CO')}\n👤 *Cliente:* ${metadata.customer.firstName} ${metadata.customer.lastName}\n📦 *Orden:* ${paymentData.external_reference}\n\n_El pedido ya aparece en tu panel de administración._`;
                        await sendTelegram(msg);
                    }
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
