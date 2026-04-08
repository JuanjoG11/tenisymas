import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { orderData } = await req.json()

        // Credenciales de Addi desde variables de entorno (con fallback de pruebas)
        const CLIENT_ID = Deno.env.get("ADDICLIENT_ID") || "p5iZ61w2OCNQlT7qFAlmiakSsXnI9yOk";
        const CLIENT_SECRET = Deno.env.get("ADDICLIENT_SECRET") || "NY1kdeqqk1fZ_nMn4kQjtYM9MYnDPB7dKRC8HmlTpQryCxqRhuYcXCnCCfZfyOY4";

        if (!CLIENT_ID || !CLIENT_SECRET) {
            console.error("Faltan credenciales de Addi en los secrets de Supabase");
            throw new Error("Addi credentials not configured");
        }
        
        const ALLY_SLUG = "tennisymasco-ecommerce";
        // Permitir configurar sandbox vía variable de entorno ADDI_SANDBOX ("true" o "false")
        const IS_SANDBOX = Deno.env.get("ADDI_SANDBOX") === "false" ? false : true; // por defecto true (staging)
        const BASE_AUTH_URL = IS_SANDBOX ? "https://auth.addi-staging.com" : "https://auth.addi.com";
        const BASE_API_URL = IS_SANDBOX ? "https://api.addi-staging.com" : "https://api.addi.com";
        const AUDIENCE = IS_SANDBOX ? "https://api.staging.addi.com" : "https://api.addi.com";

        console.log(`--- ADDI ${IS_SANDBOX ? "STAGING" : "PRODUCTION"} V3.1.5 ---`);
        console.log(`[Addi] Auth URL: ${BASE_AUTH_URL}/oauth/token | Audience: ${AUDIENCE}`);
        console.log(`[Addi] API endpoint: ${BASE_API_URL}/v1/online-applications`);
        console.log(`[Addi] Using CLIENT_ID: ${CLIENT_ID ? "[PROVIDED]" : "MISSING"}`);

        // 1. Obtener Token OAuth (V3 usa /oauth/token)
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

        if (!authRes.ok) {
            const error = await authRes.json()
            console.error("Error Auth0:", error)
            throw new Error(`Error autenticando con Addi: ${JSON.stringify(error)}`)
        }

        const { access_token } = await authRes.json()

        // Helper para limpieza de strings (Mayúsculas, sin tildes, trim)
        const cleanStr = (str: string) => {
            if (!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
        };

        // 2. Enviar Solicitud a Addi (endpoint: /v1/online-applications)
        console.log(`[Addi] Enviando solicitud para OrderID: ${orderData.orderId}`)

        const safeOrderId = String(orderData.orderId).replace(/[^a-zA-Z0-9-]/g, '');
        // Siempre usar las URLs reales del dominio en producción para que Addi las acepte
        const SITE_BASE = "https://tenisymas.com";
        const successUrl = `${SITE_BASE}/success.html`;
        const cancelUrl = `${SITE_BASE}/checkout.html`;

        const totalAmount = Math.round(Number(orderData.totalAmount));
        const items = orderData.items.map((item: any) => ({
            sku: String(item.sku || "REF001"),
            name: cleanStr(item.name || "PRODUCTO").slice(0, 100),
            quantity: Number(item.quantity || 1),
            unitPrice: Math.round(Number(item.unitPrice))
        }));

        const itemsTotal = items.reduce((acc: number, item: any) => acc + (item.unitPrice * item.quantity), 0);
        const shippingAmount = Math.max(0, totalAmount - itemsTotal);

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
                line1: cleanStr(orderData.shippingAddress.line1),
                city: cleanStr(orderData.shippingAddress.city),
                administrativeDivision: cleanStr(orderData.shippingAddress.administrativeDivision || orderData.shippingAddress.city),
                country: "CO"
            },
            allyUrlRedirection: {
                logoUrl: "https://tennisymas.com/images/logo-tm.png",
                callbackUrl: orderData.redirectionUrls?.callback || "https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/addi-callback",
                successUrl: orderData.redirectionUrls?.success || "https://tennisymas.com/success.html"
            },
            items: items
        }

        console.log("[Addi] Payload:", JSON.stringify(addiPayload, null, 2))

        // La API responde con HTTP 301, necesitamos follow:false para capturar el Location header
        const addiUrl = `${BASE_API_URL}/v1/online-applications`

        const response = await fetch(addiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`
            },
            redirect: "manual",
            body: JSON.stringify(addiPayload)
        })

        const responseStatus = response.status
        console.log(`[Addi] Response status: ${responseStatus}`)

        // Addi API v1 responde con 301 y el header Location contiene la URL de redireccion
        if (responseStatus === 301 || responseStatus === 302) {
            const locationUrl = response.headers.get("Location")
            console.log(`✅ [Addi] Redirect URL: ${locationUrl}`)

            if (!locationUrl) {
                throw new Error("Addi retornó 301 pero sin header Location")
            }

            // Registrar el pedido en Supabase
            try {
                const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
                const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

                if (SUPABASE_URL && SERVICE_ROLE) {
                    const orderRecord = {
                        customer_info: {
                            firstName: orderData.client.firstName,
                            lastName: orderData.client.lastName,
                            email: orderData.client.email,
                            phone: orderData.client.cellphone,
                            address: orderData.shippingAddress.line1,
                            city: orderData.shippingAddress.city,
                            department: orderData.shippingAddress.administrativeDivision,
                            dni: orderData.client.idNumber
                        },
                        items: orderData.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.unitPrice })),
                        total: orderData.totalAmount,
                        payment_method: 'addi',
                        status: 'pending',
                        external_reference: safeOrderId
                    }

                    await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${SERVICE_ROLE}`,
                            "apikey": SERVICE_ROLE,
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal"
                        },
                        body: JSON.stringify(orderRecord)
                    })
                    console.log("✅ Pedido Addi registrado en la base de datos")
                }
            } catch (dbErr) {
                console.error("❌ Error registrando pedido Addi (no bloqueante):", dbErr)
            }

            return new Response(JSON.stringify({ redirectionUrl: locationUrl }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        }
        else {
            const responseText = await response.text()
            let errorBody;
            try {
                errorBody = JSON.parse(responseText);
            } catch (e) {
                errorBody = { message: responseText };
            }

            console.error(`❌ ERROR ADDI API: ${responseStatus}`, errorBody);
            // Propagar error al cliente para diagnóstico rápido
            return new Response(JSON.stringify({
                error: "Addi API V3 Error",
                status: responseStatus,
                details: errorBody,
                called_url: addiUrl,
                sent_payload: addiPayload,
                message: "Revisa credenciales y modo sandbox (env ADDI_SANDBOX)"
            }), {
                status: responseStatus,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }


    } catch (err: any) {
        console.error("Error Interno Edge Function:", err.message)
        return new Response(JSON.stringify({ error: err.message, status: 500, type: "InternalError" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
