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

        // Construir el payload final asegurando tipos de datos y campos mandatorios
        const addiPayload = {
            allySlug: ALLY_SLUG,
            totalAmount: Math.floor(Number(orderData.totalAmount)),
            currency: "COP",
            orderId: orderData.orderId,
            productType: "ADDI_PAGO", // Basado en la respuesta del config endpoint
            redirectionUrls: {
                success: orderData.redirectionUrls.success,
                failure: orderData.redirectionUrls.failure || orderData.redirectionUrls.failureUrl,
                cancel: orderData.redirectionUrls.cancel || orderData.redirectionUrls.cancelUrl,
                abandoned: orderData.redirectionUrls.abandoned || orderData.redirectionUrls.success, // Safe fallback
                declined: orderData.redirectionUrls.declined || orderData.redirectionUrls.failure // Safe fallback
            },
            shippingAddress: {
                line1: cleanStr(orderData.shippingAddress.line1),
                city: cleanStr(orderData.shippingAddress.city),
                administrativeDivision: cleanStr(orderData.shippingAddress.city), // Usamos ciudad como departamento si no viene separado, en mayúsculas
                country: "CO"
            },
            client: {
                idType: orderData.client.idType || "CC",
                idNumber: String(orderData.client.idNumber).trim(),
                firstName: cleanStr(orderData.client.firstName),
                lastName: cleanStr(orderData.client.lastName),
                email: String(orderData.client.email).trim().toLowerCase(),
                cellphone: String(orderData.client.cellphone || orderData.client.phoneNumber).replace(/\D/g, '').slice(-10)
            },
            items: orderData.items.map((item: any) => ({
                sku: String(item.sku),
                name: String(item.name),
                quantity: Number(item.quantity),
                unitPrice: Math.floor(Number(item.unitPrice)),
                category: "Fashion"
            }))
        }

        console.log("[Addi] Payload final:", JSON.stringify(addiPayload, null, 2))

        // El endpoint corregido que incluye el slug como parámetro
        const addiUrl = `https://api.addi.com/v1/online-applications?ally-slug=${ALLY_SLUG}`

        const response = await fetch(addiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`,
                "X-Ally-Slug": ALLY_SLUG // Mantenemos el header por seguridad
            },
            body: JSON.stringify(addiPayload)
        })

        console.log(`[Addi] Respuesta Status: ${response.status}`)

        // 3. Manejar Respuesta
        if (response.ok) {
            const data = await response.json()
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        } else {
            const errorRaw = await response.text();
            console.error("DETALLE REAL DE ADDI:", errorRaw);

            return new Response(errorRaw, {
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
