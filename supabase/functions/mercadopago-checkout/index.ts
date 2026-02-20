import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Manejo de CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { items, customer, orderId } = await req.json()
        const ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")

        if (!ACCESS_TOKEN) {
            throw new Error("MP_ACCESS_TOKEN no configurado en Supabase")
        }

        console.log(`--- MERCADO PAGO CHECKOUT ---`)
        console.log(`Orden: ${orderId}`)

        // 1. Preparar la preferencia para Mercado Pago
        const preference = {
            items: items.map((item: any) => ({
                id: item.id || "prod-001",
                title: item.name,
                unit_price: Math.round(Number(item.price)),
                quantity: Number(item.quantity || 1),
                currency_id: "COP",
                picture_url: item.image || "",
            })),
            payer: {
                name: customer.firstName,
                surname: customer.lastName,
                email: customer.email,
                phone: {
                    area_code: "57",
                    number: customer.phone.replace(/\D/g, '').slice(-10)
                },
                identification: {
                    type: "CC",
                    number: String(customer.dni)
                },
                address: {
                    street_name: customer.address,
                    zip_code: "",
                }
            },
            back_urls: {
                success: "https://tenisymas.com/success.html",
                failure: "https://tenisymas.com/checkout.html",
                pending: "https://tenisymas.com/checkout.html"
            },
            auto_return: "approved",
            statement_descriptor: "TENNIS Y MAS",
            external_reference: orderId,
            notification_url: "https://nrlaadaggmpjtdmtntoz.supabase.co/functions/v1/mercadopago-webhook",
        }

        console.log("Preference created:", JSON.stringify(preference, null, 2))

        // 2. Crear la preferencia en la API de Mercado Pago
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(preference)
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("Error Mercado Pago API:", data)
            throw new Error(data.message || "Error al crear la preferencia de pago")
        }

        // 3. Devolver los datos necesarios para el Checkout
        return new Response(JSON.stringify({
            id: data.id,
            init_point: data.init_point,
            debug_preference: preference // TEMPORAL PARA DEPÓSITO DE LOGS FRONTAL
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err: any) {
        console.error("Error Interno:", err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
