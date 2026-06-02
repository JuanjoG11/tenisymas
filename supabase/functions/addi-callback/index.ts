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

            // 1. Verificar si la orden ya existe (por referencia exacta o fallback) y su status_payment
            let orderExists = false;
            let currentStatusPayment = '';
            try {
                const getOrderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=eq.${orderId}&select=status_payment`, {
                    headers: { "Authorization": `Bearer ${SERVICE_ROLE}`, "apikey": SERVICE_ROLE }
                });
                if (getOrderRes.ok) {
                    const existingOrders = await getOrderRes.json();
                    if (existingOrders && existingOrders.length > 0) {
                        orderExists = true;
                        currentStatusPayment = existingOrders[0].status_payment || '';
                    } else {
                        // Intentar buscar por fallback ilike
                        const fallbackRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=ilike.*${orderId}*&select=status_payment`, {
                            headers: { "Authorization": `Bearer ${SERVICE_ROLE}`, "apikey": SERVICE_ROLE }
                        });
                        if (fallbackRes.ok) {
                            const fallbackOrders = await fallbackRes.json();
                            if (fallbackOrders && fallbackOrders.length > 0) {
                                orderExists = true;
                                currentStatusPayment = fallbackOrders[0].status_payment || '';
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("❌ Error verificando estado actual de la orden:", e.message);
            }

            // Si ya tiene el estado solicitado, evitar procesar y notificar por duplicado
            if (orderExists && currentStatusPayment.toUpperCase() === incomingStatus) {
                console.log(`⚠️ Addi Callback: La orden ${orderId} ya tiene el estado ${incomingStatus}. Omitiendo.`);
                return new Response(JSON.stringify({ ok: true, duplicate: true }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            }

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

                // If the exact-match patch didn't update (non-2xx/204), try a fallback search
                if (!(res.status === 204 || (res.ok && res.status >= 200 && res.status < 300))) {
                    console.warn('⚠️ Exact external_reference patch did not succeed, trying ilike fallback')
                    try {
                        const getRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=ilike.*${orderId}*&select=id,external_reference`, {
                            method: 'GET',
                            headers: { "Authorization": `Bearer ${SERVICE_ROLE}`, "apikey": SERVICE_ROLE }
                        })

                        const getText = await getRes.text()
                        let candidates: any[] = []
                        try { candidates = JSON.parse(getText || '[]') } catch(e){ candidates = [] }

                        if (candidates.length > 0) {
                            const first = candidates[0]
                            console.log('🔎 Fallback found order:', first)
                            // Patch by primary key id
                            try {
                                const patchById = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${first.id}`, {
                                    method: 'PATCH',
                                    headers: { "Authorization": `Bearer ${SERVICE_ROLE}`, "apikey": SERVICE_ROLE, "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: newStatus, status_payment: statusPayment, paid_at: paidAt })
                                })
                                const patchText = await patchById.text()
                                console.log('🔁 Supabase fallback patch response:', patchById.status, patchText)

                                // Inform if fallback succeeded
                                if (patchById.status === 204 || (patchById.ok && patchById.status >= 200 && patchById.status < 300)) {
                                    await sendTelegram(`ℹ️ *ADDI FALLBACK*\n\nSe actualizó la orden (fallback) encontrada: ${first.external_reference} (id: ${first.id})\nNuevo estado: ${incomingStatus}`)
                                }
                            } catch (e) {
                                console.error('❌ Error patching by id (fallback):', e.message)
                            }
                        } else {
                            console.warn('⚠️ No orders found with ilike fallback for', orderId)
                        }
                    } catch (e) {
                        console.error('❌ Error during fallback search:', e.message)
                    }
                }
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
