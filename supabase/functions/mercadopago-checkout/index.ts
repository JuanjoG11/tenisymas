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

        // NOTIFICACIÓN WATI (Asegurada vía JSON Body)
        try {
            const WATI_ENDPOINT = "https://live-mt-server.wati.io/10112908";
            const WATI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6InRlbm5pc3ltYXNwZXJlaXJhY29AZ21haWwuY29tIiwibmFtZWlkIjoidGVubmlzeW1hc3BlcmVpcmFjb0BnbWFpbC5jb20iLCJlbWFpbCI6InRlbm5pc3ltYXNwZXJlaXJhY29AZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDUvMDgvMjAyNiAwMDoxMjoxMiIsInRlbmFudF9pZCI6IjEwMTEyOTA4IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.7ArKApwDNT5eqRT2dpiG-hHq0QaBEP_PUnKS8E1wuxU";
            const total = items.reduce((s:number, i:any) => s + (i.price * i.quantity), 0);
            const msg = `🛍️ *NUEVA INTENCIÓN DE COMPRA*\n\n👤 *Cliente:* ${customer.firstName} ${customer.lastName}\n📦 *Orden:* ${orderId}\n💰 *Monto:* $${total.toLocaleString('es-CO')}\n\nEl cliente ha sido enviado a Mercado Pago.`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos

            const resWati = await fetch(`${WATI_ENDPOINT}/api/v1/sendSessionMessage/573204961453`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${WATI_TOKEN}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ messageText: msg }),
                signal: controller.signal
            });
            
            const watiText = await resWati.text();
            console.log(`📡 WATI RESPONSE [${resWati.status}]:`, watiText);
            
            clearTimeout(timeoutId);
        } catch(e) {
            console.error("❌ WATI FETCH ERROR:", e.message);
        }

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
