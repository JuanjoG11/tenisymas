/**
 * Shared helper: envía el correo de confirmación de pedido via Resend.
 * Se importa desde addi-callback y mercadopago-webhook.
 */

export interface OrderEmailData {
  orderId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    department?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string | null;
    color?: string | null;
    image?: string | null;
  }>;
  total: number;
  paymentMethod: string;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY no configurada — email no enviado");
    return;
  }

  const { orderId, customer, items, total, paymentMethod } = data;

  // ---- Build items rows ----
  const itemsHtml = items.map((item) => {
    const itemTotal = Math.round(item.price * item.quantity);
    const meta = [
      item.size ? `Talla: ${item.size}` : "",
      item.color ? `Color: ${item.color}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const imgHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}" width="64" height="64"
             style="width:64px;height:64px;object-fit:cover;border-radius:10px;background:#1a1a1a;" />`
      : `<div style="width:64px;height:64px;border-radius:10px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;font-size:24px;">👟</div>`;

    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #222;vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="width:72px;vertical-align:middle;padding-right:14px;">
                <div style="position:relative;display:inline-block;">
                  ${imgHtml}
                  <span style="position:absolute;top:-6px;right:-6px;background:#ff3333;color:#fff;
                    font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;
                    display:inline-flex;align-items:center;justify-content:center;line-height:1;">
                    ${item.quantity}
                  </span>
                </div>
              </td>
              <td style="vertical-align:middle;">
                <div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:3px;">${item.name}</div>
                ${meta ? `<div style="font-size:12px;color:#888;">${meta}</div>` : ""}
              </td>
              <td style="vertical-align:middle;text-align:right;font-weight:700;font-size:14px;color:#fff;white-space:nowrap;">
                $${itemTotal.toLocaleString("es-CO")}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join("");

  const subtotal = items.reduce((s, i) => s + Math.round(i.price * i.quantity), 0);
  const shipping = total - subtotal;
  const shippingHtml =
    shipping <= 0
      ? `<span style="color:#2ecc71;font-weight:700;">GRATIS</span>`
      : `$${shipping.toLocaleString("es-CO")}`;

  const paymentLabel: Record<string, string> = {
    addi: "Addi (Financiación en cuotas)",
    mercadopago: "Mercado Pago",
    whatsapp: "WhatsApp",
    transferencia: "Transferencia / Nequi",
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Pedido Confirmado - TENNISYMAS.CO</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="https://tenisymas.com" style="text-decoration:none;">
                <img src="https://tenisymas.com/images/logo-tm.png" alt="TENNISYMAS.CO"
                  height="50" style="height:50px;display:block;" />
              </a>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#111;border:1px solid #222;border-radius:18px;padding:36px 32px;text-align:center;">

              <!-- Check icon -->
              <div style="width:72px;height:72px;border-radius:50%;
                background:linear-gradient(135deg,#2ecc71,#16a34a);
                margin:0 auto 20px;display:flex;align-items:center;justify-content:center;
                box-shadow:0 0 30px rgba(46,204,113,0.3);">
                <span style="font-size:32px;line-height:1;">✓</span>
              </div>

              <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#fff;">
                ¡Gracias, ${customer.firstName}!
              </h1>
              <p style="margin:0 0 6px;font-size:15px;color:#aaa;">
                Tu pedido está confirmado y en preparación.
              </p>
              <p style="margin:0;font-size:13px;color:#555;">
                Confirmación <span style="font-family:monospace;background:#1a1a1a;
                  border:1px solid #333;border-radius:20px;padding:2px 10px;color:#aaa;">
                  ${orderId}
                </span>
              </p>

            </td>
          </tr>

          <!-- Shipping banner -->
          <tr>
            <td style="padding-top:16px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.25);
                  border-radius:14px;padding:16px 20px;">
                <tr>
                  <td style="font-size:20px;width:36px;vertical-align:middle;">🚚</td>
                  <td style="font-size:13px;color:#aaa;padding-left:10px;vertical-align:middle;">
                    Tu pedido llegará en
                    <strong style="color:#2ecc71;">3 a 5 días hábiles</strong>.
                    Te notificaremos cuando sea despachado.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items card -->
          <tr>
            <td style="padding-top:16px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#111;border:1px solid #222;border-radius:18px;padding:24px 28px;">
                <tr>
                  <td>
                    <div style="font-size:14px;font-weight:700;color:#fff;
                      padding-bottom:14px;border-bottom:1px solid #222;margin-bottom:4px;">
                      Resumen del pedido
                    </div>
                  </td>
                </tr>
                ${itemsHtml}
                <!-- Totals -->
                <tr>
                  <td style="padding-top:14px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#888;padding:5px 0;">Subtotal</td>
                        <td style="font-size:13px;color:#aaa;text-align:right;padding:5px 0;">
                          $${subtotal.toLocaleString("es-CO")}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#888;padding:5px 0;">Envío</td>
                        <td style="font-size:13px;text-align:right;padding:5px 0;">${shippingHtml}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top:1px solid #222;padding-top:12px;"></td>
                      </tr>
                      <tr>
                        <td style="font-size:15px;font-weight:800;color:#fff;padding:4px 0;">Total</td>
                        <td style="font-size:18px;font-weight:900;color:#2ecc71;text-align:right;padding:4px 0;">
                          $${total.toLocaleString("es-CO")}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping info card -->
          <tr>
            <td style="padding-top:16px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#111;border:1px solid #222;border-radius:18px;padding:24px 28px;">
                <tr>
                  <td>
                    <div style="font-size:14px;font-weight:700;color:#fff;
                      padding-bottom:14px;border-bottom:1px solid #222;">
                      Información de envío
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                      <tr>
                        <td style="font-size:12px;color:#555;text-transform:uppercase;
                          letter-spacing:0.5px;padding:6px 0;width:100px;">Nombre</td>
                        <td style="font-size:13px;color:#ddd;padding:6px 0;">
                          ${customer.firstName} ${customer.lastName}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#555;text-transform:uppercase;
                          letter-spacing:0.5px;padding:6px 0;">Dirección</td>
                        <td style="font-size:13px;color:#ddd;padding:6px 0;">
                          ${customer.address || "—"}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#555;text-transform:uppercase;
                          letter-spacing:0.5px;padding:6px 0;">Ciudad</td>
                        <td style="font-size:13px;color:#ddd;padding:6px 0;">
                          ${customer.city || ""}${customer.city && customer.department ? ", " : ""}${customer.department || ""}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#555;text-transform:uppercase;
                          letter-spacing:0.5px;padding:6px 0;">Teléfono</td>
                        <td style="font-size:13px;color:#ddd;padding:6px 0;">
                          ${customer.phone || "—"}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#555;text-transform:uppercase;
                          letter-spacing:0.5px;padding:6px 0;">Pago</td>
                        <td style="font-size:13px;color:#ddd;padding:6px 0;">
                          ${paymentLabel[paymentMethod] || paymentMethod}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <a href="https://wa.me/573204961453" target="_blank"
                style="display:inline-block;background:linear-gradient(90deg,#ff3333,#cc0000);
                  color:#fff;text-decoration:none;font-size:15px;font-weight:700;
                  padding:16px 36px;border-radius:12px;">
                Contactar por WhatsApp
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="font-size:12px;color:#444;margin:0;">
                © 2025 TENNISYMAS.CO · Todos los derechos reservados
              </p>
              <p style="font-size:11px;color:#333;margin:6px 0 0;">
                Este correo fue enviado porque realizaste una compra en tenisymas.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TENNISYMAS.CO <pedidos@tennisymas.com>",
        to: [customer.email],
        subject: `✅ Pedido confirmado ${orderId} — TENNISYMAS.CO`,
        html,
      }),
    });

    if (res.ok) {
      console.log(`✅ Email enviado a ${customer.email}`);
    } else {
      const err = await res.text();
      console.error("❌ Resend error:", err);
    }
  } catch (e: any) {
    console.error("❌ Error enviando email:", e.message);
  }
}
