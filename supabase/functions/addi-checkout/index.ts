import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        const { orderData } = await req.json()

        // Configuración por variables de entorno (Deno.env)
        const CLIENT_ID = Deno.env.get("ADDI_CLIENT_ID") || "p5iZ61w2OCNQlT7qFAlmiakSsXnI9yOk";
        const CLIENT_SECRET = Deno.env.get("ADDI_CLIENT_SECRET") || "NY1kdeqqk1fZ_nMn4kQjtYM9MYnDPB7dKRC8HmlTpQryCxqRhuYcXCnCCfZfyOY4";
        const ALLY_SLUG = Deno.env.get("ADDI_ALLY_SLUG") || "tennisymasco-ecommerce";
        const IS_SANDBOX = (Deno.env.get("ADDI_IS_SANDBOX") || "true").toLowerCase() === "true";
        const BASE_AUTH_URL = IS_SANDBOX ? "https://auth.addi-staging.com" : "https://auth.addi.com";
        const BASE_API_URL = IS_SANDBOX ? "https://api.addi-staging.com" : "https://api.addi.com";
        const AUDIENCE = IS_SANDBOX ? "https://api.staging.addi.com" : "https://api.addi.com";

        const authRes = await fetch(`${BASE_AUTH_URL}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                audience: AUDIENCE,
                grant_type: "client_credentials",
            }),
        })

        if (!authRes.ok) throw new Error("Addi Auth Error");
        const { access_token } = await authRes.json()

        const cleanStr = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() : "";

        const safeOrderId = String(orderData.orderId).replace(/[^a-zA-Z0-9-]/g, '');
        const totalAmount = Math.round(Number(orderData.totalAmount));
        const items = orderData.items.map((item: any) => ({
            sku: String(item.sku || "REF001"),
            name: cleanStr(item.name || "PRODUCTO").slice(0, 100),
            quantity: Number(item.quantity || 1),
            unitPrice: Math.round(Number(item.unitPrice)),
            size: item.size || 'N/A'
        }));

        const itemsTotal = items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);
        const shippingAmount = Math.max(0, totalAmount - itemsTotal);

        const redirectionInput = (orderData.redirectionUrls || {});
        const successUrlRaw = redirectionInput.success || redirectionInput.redirectionUrl || redirectionInput.successUrl || `${req.headers.get("origin") || "https://tennisymas.com"}/success.html`;
        const cancelUrlRaw = redirectionInput.cancel || redirectionInput.failure || redirectionInput.cancelUrl || `${req.headers.get("origin") || "https://tennisymas.com"}/checkout.html`;
        const successUrl = successUrlRaw.includes('?') ? `${successUrlRaw}&orderId=${safeOrderId}` : `${successUrlRaw}?orderId=${safeOrderId}`;
        const cancelUrl = cancelUrlRaw.includes('?') ? `${cancelUrlRaw}&orderId=${safeOrderId}` : `${cancelUrlRaw}?orderId=${safeOrderId}`;
        const callbackUrl = redirectionInput.callback || redirectionInput.callbackUrl || "https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/addi-callback";

        const addiPayload = {
            allySlug: ALLY_SLUG,
            orderId: safeOrderId,
            totalAmount: totalAmount,
            shippingAmount: shippingAmount,
            taxAmount: 0,
            currency: "COP",
            client: {
                idType: "CC",
                idNumber: String(orderData.client.idNumber).trim(),
                firstName: cleanStr(orderData.client.firstName),
                lastName: cleanStr(orderData.client.lastName),
                email: String(orderData.client.email).trim().toLowerCase(),
                cellphone: String(orderData.client.cellphone).replace(/\D/g, '').slice(-10).padStart(10, '0')
            },
            shippingAddress: {
                lineOne: cleanStr(orderData.shippingAddress.line1),
                city: cleanStr(orderData.shippingAddress.city),
                state: cleanStr(orderData.shippingAddress.administrativeDivision || orderData.shippingAddress.city),
                country: "CO"
            },
            allyUrlRedirection: {
                logoUrl: "https://tennisymas.com/images/logo-tm.png",
                callbackUrl: callbackUrl,
                successUrl: successUrl,
                cancelUrl: cancelUrl,
                redirectionUrl: successUrl
            },
            items: items
        }

        // Log payload (no credenciales). Útil para debugging.
        console.log('📨 Addi payload:', JSON.stringify(addiPayload, null, 2));

        const response = await fetch(`${BASE_API_URL}/v1/online-applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${access_token}` },
            redirect: "manual",
            body: JSON.stringify(addiPayload)
        })

        if (response.status === 301 || response.status === 302) {
            const locationUrl = response.headers.get("Location")
            
            // Registrar en Supabase
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
            const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
            if (SUPABASE_URL && SERVICE_ROLE) {
                await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${SERVICE_ROLE}`, "apikey": SERVICE_ROLE, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customer_info: {
                            firstName: orderData.client.firstName,
                            lastName: orderData.client.lastName,
                            email: orderData.client.email,
                            phone: orderData.client.cellphone,
                            dni: orderData.client.idNumber,
                            address: orderData.shippingAddress.line1,
                            city: orderData.shippingAddress.city,
                            department: orderData.shippingAddress.administrativeDivision
                        },
                        items: orderData.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.unitPrice, size: i.size })),
                        total: orderData.totalAmount,
                        payment_method: 'addi',
                        status: 'pending',
                        external_reference: safeOrderId
                    })
                });
            }

            // --- DISEÑO DE NOTIFICACIÓN TELEGRAM (ESTILO MODAL) ---
            let productsText = "";
            orderData.items.forEach((i: any) => {
                productsText += `• *${i.name}*\n  Talla: ${i.size || 'N/A'} | Cant: ${i.quantity} | $${Number(i.unitPrice).toLocaleString('es-CO')}\n`;
            });

            const msg = `📄 *DETALLES DEL PEDIDO (${safeOrderId})*\n` +
                        `------------------------------------------\n` +
                        `👤 *DATOS CLIENTE*\n` +
                        `• *Nombre:* ${orderData.client.firstName} ${orderData.client.lastName}\n` +
                        `• *Teléfono:* ${orderData.client.cellphone}\n` +
                        `• *DNI/CC:* ${orderData.client.idNumber}\n\n` +
                        `📍 *UBICACIÓN ENVÍO*\n` +
                        `• *Ciudad:* ${orderData.shippingAddress.city}\n` +
                        `• *Depto:* ${orderData.shippingAddress.administrativeDivision}\n` +
                        `• *Dirección:* ${orderData.shippingAddress.line1}\n\n` +
                        `🛍️ *PRODUCTOS SOLICITADOS*\n` +
                        `${productsText}\n` +
                        `💳 *MÉTODO:* ADDI\n` +
                        `💰 *TOTAL:* *$${totalAmount.toLocaleString('es-CO')}*\n` +
                        `------------------------------------------\n` +
                        `_El cliente ha sido enviado a Addi._`;

            await sendTelegram(msg);

            return new Response(JSON.stringify({ redirectionUrl: locationUrl }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        } else {
            const respText = await response.text();
            let respBody: any = respText;
            try { respBody = JSON.parse(respText); } catch (e) {}
            console.error('❌ Addi API returned non-redirect:', response.status, respBody);
            return new Response(JSON.stringify({ error: "Addi API Error", status: response.status, body: respBody, called_url: `${BASE_API_URL}/v1/online-applications`, sent_payload: addiPayload }), { status: 400, headers: corsHeaders });
        }

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})
