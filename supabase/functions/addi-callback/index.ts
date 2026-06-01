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
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: msg,
                parse_mode: "Markdown"
            })
        });
    } catch (e) {
        console.error("❌ TELEGRAM ERROR:", e.message);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const body = await req.json()
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
        const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

        console.log('📥 Addi callback received:', JSON.stringify(body))

        // Normalize possible order id fields
        const orderId = body.orderId || body.order_id || body.externalReference || body.external_reference || body.orderReference || body.order_reference

        if (!orderId) {
            console.warn('⚠️ Addi callback missing order id')
            return new Response(JSON.stringify({ error: 'missing order id' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
        }

        if (SUPABASE_URL && SERVICE_ROLE) {
            const incomingStatus = (body.status || '').toString().toUpperCase()
            let newStatus = 'pending'
            let statusPayment = incomingStatus || 'PENDING'
            let paidAt: string | null = null

            if (incomingStatus === 'APPROVED') {
                newStatus = 'paid'
                statusPayment = 'APPROVED'
                paidAt = new Date().toISOString()
            } else if (['REJECTED', 'DECLINED', 'ABANDONED'].includes(incomingStatus)) {
                newStatus = 'cancelled'
                statusPayment = incomingStatus
            } else {
                newStatus = 'pending'
                statusPayment = incomingStatus || 'PENDING'
            }

            // Patch only when necessary (idempotent-ish)
            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=eq.${orderId}`, {
                    method: "PATCH",
                    headers: { "Authorization": `Bearer ${SERVICE_ROLE}`, "apikey": SERVICE_ROLE, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: newStatus,
                        status_payment: statusPayment,
                        paid_at: paidAt
                    })
                })

                const respText = await res.text()
                console.log('🔁 Supabase patch response:', res.status, respText)
            } catch (e) {
                console.error('❌ Error patching order:', e.message)
            }

            // NOTIFICACIÓN TELEGRAM
            const icon = incomingStatus === 'APPROVED' ? '✅' : 'ℹ️';
            const msg = `${icon} *ACTUALIZACIÓN ADDI*\n\n📦 *Orden:* ${orderId}\n📈 *Nuevo Estado:* ${incomingStatus}\n\nRevisa el panel administrativo para más detalles.`;
            await sendTelegram(msg);
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err: any) {
        console.error('❌ Addi callback handler error:', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
