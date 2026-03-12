import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const body = await req.json()
        console.log("--- ADDI CALLBACK RECIBIDO ---")
        console.log("Status:", body.status)
        console.log("OrderID:", body.orderId)
        console.log("Full body:", JSON.stringify(body, null, 2))

        // Estados posibles: APPROVED, REJECTED, DECLINED, ABANDONED, PENDING, INTERNAL_ERROR
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
        const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

        if (SUPABASE_URL && SERVICE_ROLE && body.orderId) {
            let newStatus = 'pending'
            let statusPayment = body.status?.toLowerCase() || 'pending'

            if (body.status === 'APPROVED') {
                newStatus = 'pending' // Pagado, pendiente de despacho
            } else if (['REJECTED', 'DECLINED', 'ABANDONED'].includes(body.status)) {
                newStatus = 'cancelled'
            }

            await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=eq.${body.orderId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${SERVICE_ROLE}`,
                    "apikey": SERVICE_ROLE,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    status: newStatus,
                    status_payment: statusPayment,
                    paid_at: body.status === 'APPROVED' ? new Date().toISOString() : null
                })
            })
            console.log(`✅ Pedido ${body.orderId} actualizado a: ${newStatus} / ${statusPayment}`)
        }

        // Addi requiere que el callback devuelva el mismo objeto recibido con HTTP 200
        return new Response(JSON.stringify(body), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err: any) {
        console.error("Error en callback Addi:", err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
