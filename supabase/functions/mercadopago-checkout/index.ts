import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { items, customer, orderId } = await req.json()
        const ACCESS_TOKEN = "APP_USR-8626270631469210-022013-797bdb9a76a3d85b866049fb85eb4e38-3213704453";

        console.log(`--- MP CHECKOUT: ${orderId} ---`)

        // Generar un external_reference único por cada intento
        const uniqueRef = `${orderId}-${Date.now()}`;

        const preference = {
            items: items.map((item: any) => ({
                title: String(item.name).replace(/[^\w\s]/gi, '').substring(0, 50),
                unit_price: Math.round(Number(item.price)),
                quantity: Number(item.quantity || 1),
                currency_id: "COP"
            })),
            payer: {
                email: customer.email,
                name: customer.firstName,
                surname: customer.lastName
            },
            back_urls: {
                success: "https://tenisymas.com/success.html",
                failure: "https://tenisymas.com/checkout.html",
                pending: "https://tenisymas.com/checkout.html"
            },
            auto_return: "approved",
            external_reference: uniqueRef
        }

        const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(preference)
        })

        const data = await res.json()

        if (!res.ok) throw new Error(data.message || "Error MP");

        return new Response(JSON.stringify({
            id: data.id,
            init_point: data.init_point
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err: any) {
        console.error("Checkout Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
