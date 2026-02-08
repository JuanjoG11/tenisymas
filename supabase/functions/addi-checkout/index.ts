import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ADDI_CLIENT_ID = Deno.env.get("ADDI_CLIENT_ID")
const ADDI_CLIENT_SECRET = Deno.env.get("ADDI_CLIENT_SECRET")
const ADDI_ENV = Deno.env.get("ADDI_ENV") || "production" // Default to production

// Environment configurations
const CONFIGS = {
    production: {
        authDomain: "auth.addi.com",
        apiAudience: "https://api.addi.com",
        apiUrl: "https://api.co.addi.com/v1/applications"
    },
    sandbox: {
        authDomain: "auth.addi-staging.com",
        apiAudience: "https://api.addi.com",
        apiUrl: "https://api.co.addi.com/v1/applications"
    }
}

const currentConfig = ADDI_ENV === "sandbox" ? CONFIGS.sandbox : CONFIGS.production

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { order, customer } = body

        console.log("Processing Addi checkout for order:", order?.orderId)

        if (!ADDI_CLIENT_ID || !ADDI_CLIENT_SECRET) {
            console.error("Missing Addi credentials in environment variables")
            throw new Error("Configuración incompleta: Credenciales de Addi no encontradas.")
        }

        // 1. Get Access Token from Auth0
        console.log(`Fetching Auth0 token for environment: ${ADDI_ENV}...`)
        const authRes = await fetch(`https://${currentConfig.authDomain}/oauth/token`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                client_id: ADDI_CLIENT_ID,
                client_secret: ADDI_CLIENT_SECRET,
                audience: currentConfig.apiAudience,
                grant_type: 'client_credentials',
            }),
        })

        if (!authRes.ok) {
            const authErrorText = await authRes.text()
            console.error("Auth0 Error Details:", {
                status: authRes.status,
                statusText: authRes.statusText,
                body: authErrorText
            })
            throw new Error(`Error de autenticación con Addi (${authRes.status}): ${authRes.statusText}. Cuerpo: ${authErrorText}`)
        }

        const authData = await authRes.json()
        if (!authData.access_token) {
            console.error("Auth0 Response missing token:", authData)
            throw new Error("No se pudo obtener el token de acceso de Addi.")
        }

        // 2. Create Application in Addi
        const addiUrl = `${currentConfig.apiUrl}?ally-slug=tennisymasco-ecommerce`
        console.log("Creating Addi application at:", addiUrl)
        const addiRes = await fetch(addiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${authData.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                allySlug: "tennisymasco-ecommerce",
                totalAmount: order.total,
                currency: "COP",
                orderId: `TM-${Date.now()}`,
                items: order.items.map((item: any) => ({
                    sku: item.id.toString(),
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.priceClean,
                })),
                client: {
                    idType: "CC",
                    idNumber: customer.dni,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email || "noreply@tenisymas.com",
                    cellphone: customer.phone,
                },
                shippingAddress: {
                    line1: customer.address,
                    city: customer.city,
                    country: "CO",
                },
                redirectionUrls: {
                    success: "https://tenisymas.com/success.html",
                    failure: "https://tenisymas.com/checkout.html",
                    cancel: "https://tenisymas.com/checkout.html",
                },
            }),
        })

        const addiData = await addiRes.json()

        if (addiRes.status >= 200 && addiRes.status < 300 && addiData.applicationID && addiData.redirectionUrl) {
            console.log("Addi application created successfully:", addiData.applicationID)
            return new Response(
                JSON.stringify({ redirectUrl: addiData.redirectionUrl }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
        } else {
            console.error("Addi API Error:", addiRes.status, addiData)
            const errorMessage = addiData.message || addiData.error_description || "Parámetros de orden inválidos o error en Addi.";
            throw new Error(`Error de Addi (${addiRes.status}): ${errorMessage}`)
        }

    } catch (error) {
        console.error("Function Error:", error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
