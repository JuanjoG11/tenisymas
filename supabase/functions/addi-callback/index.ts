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

        if (SUPABASE_URL && SERVICE_ROLE && body.orderId) {
            let newStatus = 'pending'
            let statusPayment = body.status?.toLowerCase() || 'pending'

            if (body.status === 'APPROVED') {
                newStatus = 'pending' 
            } else if (['REJECTED', 'DECLINED', 'ABANDONED'].includes(body.status)) {
                newStatus = 'cancelled'
            }

            await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=eq.${body.orderId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${SERVICE_ROLE}`, "apikey": SERVICE_ROLE, "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    status_payment: statusPayment,
                    paid_at: body.status === 'APPROVED' ? new Date().toISOString() : null
                })
            });

            // NOTIFICACIÓN TELEGRAM
            const icon = body.status === 'APPROVED' ? '✅' : 'ℹ️';
            const msg = `${icon} *ACTUALIZACIÓN ADDI*\n\n📦 *Orden:* ${body.orderId}\n📈 *Nuevo Estado:* ${body.status}\n\nRevisa el panel administrativo para más detalles.`;
            await sendTelegram(msg);
        }

        return new Response(JSON.stringify(body), {
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
