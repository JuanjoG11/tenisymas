import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { orderData } = await req.json()
        const CLIENT_ID = Deno.env.get("ADDI_CLIENT_ID")
        const CLIENT_SECRET = Deno.env.get("ADDI_CLIENT_SECRET")
        const ALLY_SLUG = "tennisymasco-ecommerce"
        console.log("--- ADDI CHECKOUT V3.0.1 ---");

        // 1. Obtener Token Auth0
        const authRes = await fetch("https://auth.addi.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                audience: "https://api.addi.com",
                grant_type: "client_credentials",
            }),
        })

        if (!authRes.ok) {
            const error = await authRes.json()
            console.error("Error Auth0:", error)
            throw new Error("Error autenticando con Addi")
        }

        const { access_token } = await authRes.json()

        // Helper para limpieza de strings (Mayúsculas, sin tildes, trim)
        const cleanStr = (str: string) => {
            if (!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
        };

        // 2. Enviar Solicitud a Addi (API V3 Standard)
        console.log(`[Addi] Enviando solicitud V3 para OrderID: ${orderData.orderId}`)

        const safeOrderId = String(orderData.orderId).replace(/[^a-zA-Z0-9-]/g, '');

        const addiPayload = {
            allySlug: ALLY_SLUG,
            totalAmount: Math.round(Number(orderData.totalAmount)),
            currency: "COP",
            orderId: safeOrderId,
            client: {
                idType: "CC",
                idNumber: String(orderData.client.idNumber).trim(),
                firstName: cleanStr(orderData.client.firstName),
                lastName: cleanStr(orderData.client.lastName),
                email: String(orderData.client.email).trim().toLowerCase(),
                cellphone: String(orderData.client.cellphone).replace(/\D/g, '').slice(-10)
            },
            shippingAddress: {
                line1: cleanStr(orderData.shippingAddress.line1),
                city: cleanStr(orderData.shippingAddress.city),
                administrativeDivision: cleanStr(orderData.shippingAddress.administrativeDivision || orderData.shippingAddress.city),
                country: "CO"
            },
            redirectionUrls: {
                success: "https://tenisymas.com/success.html",
                failure: "https://tenisymas.com/checkout.html",
                cancel: "https://tenisymas.com/checkout.html"
            },
            items: orderData.items.map((item: any) => ({
                sku: String(item.sku || "REF001"),
                name: cleanStr(item.name || "PRODUCTO"),
                quantity: Number(item.quantity || 1),
                unitPrice: Math.round(Number(item.unitPrice))
            }))
        }

        console.log("[Addi] Payload V3:", JSON.stringify(addiPayload, null, 2))

        const addiUrl = `https://api.addi.com/v3/checkout-sessions`

        const response = await fetch(addiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`,
                "X-Ally-Slug": ALLY_SLUG
            },
            body: JSON.stringify(addiPayload)
        })

        const responseStatus = response.status
        const responseText = await response.text()
        console.log(`[Addi] Response V3 (${responseStatus}): ${responseText}`)

        if (response.ok) {
            const data = JSON.parse(responseText)

            // (NUEVO) Registrar el pedido en la tabla 'orders' para el administrador
            try {
                const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
                const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

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

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        }
        else {
            let errorBody;
            try { errorBody = JSON.parse(responseText); } catch (e) { errorBody = { message: responseText }; }

            return new Response(JSON.stringify({
                error: "Addi API V3 Error",
                status: responseStatus,
                details: errorBody,
                sent_payload: addiPayload
            }), {
                status: responseStatus,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }


    } catch (err: any) {
        console.error("Error Interno Edge Function:", err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
