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
        const { items, customer, orderId } = await req.json()
        const ACCESS_TOKEN = "APP_USR-8626270631469210-022013-797bdb9a76a3d85b866049fb85eb4e38-3213704453";

        const preference = {
            items: items.map((item: any) => ({
                id: item.id || "item-123",
                title: item.name,
                unit_price: Math.round(Number(item.price)),
                quantity: Number(item.quantity || 1),
                currency_id: "COP",
                picture_url: item.image || ""
            })),
            // RESTAURAMOS EL PAYER: Es vital para la confianza de Mercado Pago en producción
            payer: {
                name: customer.firstName,
                surname: customer.lastName,
                email: customer.email,
                identification: { type: "CC", number: String(customer.dni || "") },
                address: { street_name: customer.address, zip_code: "" }
            },
            // METADATA: Para que el webhook cree la orden solo al pagar
            metadata: {
                customer: customer,
                items: items,
                order_id: orderId
            },
            back_urls: {
                success: "https://tenisymas.com/success.html",
                failure: "https://tenisymas.com/checkout.html",
                pending: "https://tenisymas.com/checkout.html"
            },
            auto_return: "approved",
            binary_mode: false,
            statement_descriptor: "TENIS Y MAS",
            external_reference: `${orderId}-${Date.now()}`,
            notification_url: "https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/mercadopago-webhook"
        }

        const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: { "Authorization": `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(preference)
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Error MP");

        // NOTIFICACIÓN TELEGRAM
        const total = items.reduce((s:number, i:any) => s + (i.price * i.quantity), 0);
        const msg = `⏳ *NUEVA INTENCIÓN DE COMPRA*\n\n👤 *Cliente:* ${customer.firstName} ${customer.lastName}\n💰 *Monto:* $${total.toLocaleString('es-CO')}\n📦 *Ref:* ${orderId}\n\n_El cliente está en la pasarela. Esperando pago._`;
        await sendTelegram(msg);

        return new Response(JSON.stringify({ id: data.id, init_point: data.init_point }), {
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
