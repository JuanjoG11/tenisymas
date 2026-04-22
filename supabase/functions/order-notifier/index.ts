import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const payload = await req.json()
        const order = payload.record // Datos del nuevo pedido
        
        console.log("🔔 Procesando notificación para pedido:", order.id)

        const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_TOKEN")
        const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
        const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "tu-email@ejemplo.com"

        const customer = order.customer_info || {}
        const totalFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.total)
        
        // 1. CONSTRUIR MENSAJE PARA TELEGRAM
        const telegramMessage = `
🚀 *¡NUEVO PEDIDO RECIBIDO!*
----------------------------
👤 *Cliente:* ${customer.firstName} ${customer.lastName}
📍 *Ciudad:* ${customer.city}
💰 *Total:* ${totalFormatted}
💳 *Método:* ${order.payment_method.toUpperCase()}
📱 *Teléfono:* ${customer.phone}

📦 *Productos:*
${order.items.map((i: any) => `- ${i.quantity}x ${i.name}`).join('\n')}

[Ver en el Panel Admin](https://tenisymas.co/admin.html)
`.trim()

        // 2. ENVIAR A TELEGRAM
        if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: telegramMessage,
                    parse_mode: 'Markdown'
                })
            })
            console.log("✅ Telegram enviado")
        }

        // 3. ENVIAR EMAIL (Vía Resend)
        if (RESEND_API_KEY) {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: 'Tennis y Mas <onboarding@resend.dev>',
                    to: [ADMIN_EMAIL],
                    subject: `🛍️ Nuevo Pedido: ${customer.firstName} ${customer.lastName}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                            <h2 style="color: #ff3333;">¡Tienes una nueva venta!</h2>
                            <p><strong>Cliente:</strong> ${customer.firstName} ${customer.lastName}</p>
                            <p><strong>Ubicación:</strong> ${customer.city}, ${customer.department}</p>
                            <p><strong>Total:</strong> ${totalFormatted}</p>
                            <hr/>
                            <h3>Productos:</h3>
                            <ul>
                                ${order.items.map((i: any) => `<li>${i.quantity}x ${i.name} - Talla: ${i.size || 'N/A'}</li>`).join('')}
                            </ul>
                            <br/>
                            <a href="https://tenisymas.co/admin.html" style="background: #ff3333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Panel de Control</a>
                        </div>
                    `
                })
            })
            console.log("✅ Email enviado")
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
