import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sendOrderConfirmationEmail } from "../_shared/send-email.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_TOKEN") || "8751458666:AAEEFXichBYpwLh2f86aaozkXZ8sGpnnhJw";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") || "7501484183";

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
        const url = new URL(req.url)
        let id = url.searchParams.get("id") || url.searchParams.get("data.id")
        let topic = url.searchParams.get("topic") || url.searchParams.get("type")

        // SI NO ESTÁN EN URL, INTENTAMOS LEER EL BODY JSON (WEBHOOK V2 DE MERCADO PAGO)
        if (!id || !topic) {
            try {
                const body = await req.json()
                if (body) {
                    id = id || (body.data && String(body.data.id)) || (body.id && String(body.id))
                    topic = topic || body.type || (body.action && body.action.split('.')[0])
                }
            } catch (e) {
                console.error("Error al parsear body del webhook:", e)
            }
        }

        if (topic === 'payment' && id) {
            const ACCESS_TOKEN = "APP_USR-8626270631469210-022013-797bdb9a76a3d85b866049fb85eb4e38-3213704453";
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
            const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
            })

            if (mpRes.ok) {
                const paymentData = await mpRes.json()
                const status = paymentData.status
                const metadata = paymentData.metadata

                // SOLO SI EL PAGO ESTÁ APROBADO, CREAMOS LA ORDEN EN LA DB
                if (status === 'approved' && metadata && SUPABASE_URL && SERVICE_ROLE) {
                    const externalRef = paymentData.external_reference;
                    const customer = metadata.customer || {};

                    // 1. Verificar si la orden ya existe para evitar duplicación
                    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=eq.${externalRef}&select=id`, {
                        headers: {
                            "Authorization": `Bearer ${SERVICE_ROLE}`,
                            "apikey": SERVICE_ROLE
                        }
                    });

                    if (checkRes.ok) {
                        const existingOrders = await checkRes.json();
                        if (existingOrders && existingOrders.length > 0) {
                            console.log(`⚠️ MP Webhook: La orden con referencia ${externalRef} ya existe. Evitando duplicación.`);
                            try {
                                const msgExist = `✅ *PAGO APROBADO*\n\n📦 *Orden ya registrada:* ${externalRef}\n👤 *Cliente:* ${customer.firstName || customer.first_name || ''} ${customer.lastName || customer.last_name || ''}\n💰 *Monto:* $${paymentData.transaction_amount?.toLocaleString ? paymentData.transaction_amount.toLocaleString('es-CO') : paymentData.transaction_amount}\n\n_Nota: la orden ya existe en la base de datos._`;
                                await sendTelegram(msgExist);
                            } catch (e) {}

                            return new Response(JSON.stringify({ received: true, already_processed: true }), {
                                headers: { ...corsHeaders, "Content-Type": "application/json" },
                                status: 200,
                            });
                        }
                    }
                    
                    // Reuse the earlier `customer` variable defined above
                    const customerInfo = {
                        ...customer,
                        firstName: customer.firstName || customer.first_name || '',
                        lastName: customer.lastName || customer.last_name || ''
                    }

                    const orderData = {
                        external_reference: externalRef,
                        customer_info: customerInfo,
                        items: metadata.items,
                        total: paymentData.transaction_amount,
                        payment_method: 'mercadopago',
                        status: 'pending', // Pendiente de despacho
                        status_payment: 'approved',
                        paid_at: new Date().toISOString()
                    }

                    // Insertar en la tabla de órdenes
                    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${SERVICE_ROLE}`,
                            "apikey": SERVICE_ROLE,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(orderData)
                    })

                    if (dbRes.ok) {
                        console.log("✅ ORDEN CREADA TRAS PAGO EXITOSO");

                        // Enviar email de confirmación al cliente
                        try {
                            const emailItems = (metadata.items || []).map((i: any) => ({
                                name: i.name || i.title || "Producto",
                                quantity: Number(i.quantity || 1),
                                price: Number(i.price || i.unit_price || 0),
                                size: i.size || null,
                                color: i.color || null,
                                image: i.image || i.picture_url || null,
                            }));
                            await sendOrderConfirmationEmail({
                                orderId: externalRef || "TM-MP",
                                customer: {
                                    firstName: customerInfo.firstName,
                                    lastName: customerInfo.lastName,
                                    email: customerInfo.email,
                                    phone: customerInfo.phone || "",
                                    address: customerInfo.address || "",
                                    city: customerInfo.city || "",
                                    department: customerInfo.department || "",
                                },
                                items: emailItems,
                                total: paymentData.transaction_amount,
                                paymentMethod: "mercadopago",
                            });
                        } catch (emailErr: any) {
                            console.error("❌ Error enviando email confirmación MP:", emailErr.message);
                        }

                        try {
                            const msg = `✅ *PAGO APROBADO - ORDEN CREADA*\n\n📦 *Ref:* ${externalRef}\n👤 *Cliente:* ${customer.firstName || customer.first_name || ''} ${customer.lastName || customer.last_name || ''}\n💰 *Monto:* $${paymentData.transaction_amount?.toLocaleString ? paymentData.transaction_amount.toLocaleString('es-CO') : paymentData.transaction_amount}\n\nRevisa el panel administrativo para más detalles.`;
                            await sendTelegram(msg);
                        } catch (e) {}
                    }
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
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
