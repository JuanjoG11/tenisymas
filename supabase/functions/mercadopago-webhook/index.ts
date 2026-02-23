import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Manejo de CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const url = new URL(req.url)
        const topic = url.searchParams.get("topic") || url.searchParams.get("type")
        const id = url.searchParams.get("id") || url.searchParams.get("data.id")

        console.log(`--- WEBHOOK MERCADO PAGO ---`)
        console.log(`Topic: ${topic}, ID: ${id}`)

        if (topic === 'payment' && id) {
            const ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
            const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

            if (!ACCESS_TOKEN) throw new Error("MP_ACCESS_TOKEN no configurado")

            // 1. Consultar el estado del pago en Mercado Pago
            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
            })

            if (!mpRes.ok) {
                console.error("Error consultando pago en MP:", await mpRes.text())
                return new Response("Error MP", { status: 400 })
            }

            const paymentData = await mpRes.json()
            const externalReference = paymentData.external_reference // Nuestro OrderID
            const status = paymentData.status // 'approved', 'pending', 'rejected', etc.

            console.log(`Pedido: ${externalReference}, Estado: ${status}`)

            // 2. Actualizar el pedido en la base de datos de Supabase
            if (SUPABASE_URL && SERVICE_ROLE && externalReference) {
                // Mapear estados de MP a nuestros estados de pedido
                let orderStatus = 'pending'
                if (status === 'approved') orderStatus = 'pending' // Sigue pendiente de despacho pero pago aprobado
                // Aquí podrías añadir lógica extra si quieres marcar específicamente como 'pagado'

                const { error } = await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=eq.${externalReference}`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${SERVICE_ROLE}`,
                        "apikey": SERVICE_ROLE,
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    body: JSON.stringify({
                        status_payment: status,
                        paid_at: status === 'approved' ? new Date().toISOString() : null
                    })
                })

                if (error) console.error("Error actualizando DB:", error)
                else console.log("✅ Pedido actualizado en DB")
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err: any) {
        console.error("Error Webhook:", err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
