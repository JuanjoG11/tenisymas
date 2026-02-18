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

        // 2. Enviar Solicitud a Addi (Payload Estricto y Endpoint Corregido)
        console.log(`[Addi] Enviando solicitud para OrderID: ${orderData.orderId}`)

        const cleanedAdminDivision = cleanStr(orderData.shippingAddress.administrativeDivision || orderData.shippingAddress.city);

        // Construir el payload final ESTÁNDAR V1 (Último intento técnico)
        const addiPayload = {
            allySlug: ALLY_SLUG,
            totalAmount: Math.round(Number(orderData.totalAmount)),
            currency: "COP",
            orderId: String(orderData.orderId),
            productType: "ADDI_PAGO",
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
                administrativeDivision: cleanedAdminDivision,
                country: "CO"
            },
            redirectionUrls: {
                success: "https://tenisymas.com/success.html",
                failure: "https://tenisymas.com/checkout.html",
                cancel: "https://tenisymas.com/checkout.html",
                abandoned: "https://tenisymas.com/checkout.html",
                declined: "https://tenisymas.com/checkout.html"
            },
            items: orderData.items.map((item: any) => ({
                sku: String(item.sku || "REF001"),
                name: cleanStr(item.name || "PRODUCTO"),
                quantity: Number(item.quantity || 1),
                unitPrice: Math.round(Number(item.unitPrice))
            }))
        }

        console.log("[Addi] Payload final (Final Technical Attempt):", JSON.stringify(addiPayload, null, 2))

        // Usamos el slug tanto en el header como en la URL (algunas APIs lo piden duplicado)
        const addiUrl = `https://api.addi.com/v1/online-applications?ally-slug=${ALLY_SLUG}`

        const response = await fetch(addiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`,
                "X-Ally-Slug": ALLY_SLUG,
                "X-Region": "CO"
            },
            body: JSON.stringify(addiPayload)
        })

        console.log(`[Addi] Respuesta Status: ${response.status}`)

        // 3. Manejar Respuesta
        const responseText = await response.text()
        console.log(`[Addi] Cuerpo de respuesta REAL de Addi: ${responseText}`)

        if (response.ok) {
            const data = JSON.parse(responseText)
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        }
        else {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText };
            }

            return new Response(JSON.stringify({
                ...errorData,
                debug_payload: addiPayload
            }), {
                status: response.status,
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
