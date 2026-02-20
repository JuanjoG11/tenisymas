console.log('%c🚀 ADDI CORE ENGINE V3.0 ACTIVATED', 'color: #00ff00; font-weight: bold; font-size: 16px; background: black; padding: 5px;');
// ==================== CHECKOUT LOGIC FOR ADDI ====================

let checkoutCart = [];
const SHIPPING_COST = 16500;

// ==================== MERCADO PAGO CONFIGURATION ====================
const MP_PUBLIC_KEY = 'APP_USR-c4eb2276-e656-4cc8-ad42-3135168127fe';
const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: 'es-CO' });
let selectorsSetup = false;


document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 DOM Loaded - V3 Engine Ready');
    loadCheckoutCart();
    setupPaymentSelectors();
    setupCheckoutForm();
});

function loadCheckoutCart() {
    const savedCart = localStorage.getItem('tm_cart');
    if (savedCart) {
        checkoutCart = JSON.parse(savedCart);
        renderCheckoutSummary();
    } else {
        window.location.href = 'collections.html';
    }
}

function renderCheckoutSummary() {
    const listContainer = document.getElementById('checkoutItemsList');
    const subtotalEl = document.getElementById('summarySubtotal');
    const totalEl = document.getElementById('summaryTotal');
    if (!listContainer) return;
    let subtotal = 0;
    listContainer.innerHTML = checkoutCart.map(item => {
        const priceClean = parseInt(item.price.replace(/[^0-9]/g, ''));
        const itemTotal = priceClean * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="checkout-item-row">
                <div class="item-img-wrapper">
                    <img src="${item.image}" alt="${item.name}">
                    <span class="item-qty-badge">${item.quantity}</span>
                </div>
                <div class="item-info-row">
                    <h4>${item.name}</h4>
                </div>
                <div class="item-price-final">
                    $${itemTotal.toLocaleString('es-CO')}
                </div>
            </div>
        `;
    }).join('');
    const total = subtotal + SHIPPING_COST;
    subtotalEl.textContent = `$${subtotal.toLocaleString('es-CO')}`;
    totalEl.textContent = `$${total.toLocaleString('es-CO')}`;
}

function setupPaymentSelectors() {
    if (selectorsSetup) return;
    selectorsSetup = true;

    const cards = document.querySelectorAll('.payment-method-card');
    const mainSubmitBtn = document.querySelector('.btn-checkout-final');

    cards.forEach(card => {
        card.addEventListener('click', async () => {
            const method = card.dataset.method;
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Ensure submit button is always visible
            if (mainSubmitBtn) mainSubmitBtn.style.display = 'block';

            // Toggle visibility of Payment Brick container (now always hidden)
            const mpView = document.getElementById('premiumMPView');
            if (mpView) {
                mpView.style.display = 'none';
            }
        });
    });
}

function setupCheckoutForm() {
    const form = document.getElementById('mainCheckoutForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedMethod = document.querySelector('.payment-method-card.active')?.dataset.method;
            if (!selectedMethod) {
                alert('Por favor selecciona un método de pago.');
                return;
            }

            const customerData = {
                email: document.getElementById('email').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                dni: document.getElementById('dni').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                department: document.getElementById('department').value,
                phone: document.getElementById('phone').value
            };

            if (selectedMethod === 'addi') {
                handleAddiCheckout(customerData);
            } else if (selectedMethod === 'mercadopago') {
                handleMercadoPagoCheckout(customerData);
            } else if (selectedMethod === 'whatsapp') {
                handleWhatsAppFallback(customerData);
            } else {
                alert('Método de pago en mantenimiento.');
            }
        });
    }
}

async function handleAddiCheckout(customer) {
    const btn = document.querySelector('.btn-checkout-final');
    const originalText = btn.textContent;
    btn.textContent = 'Procesando con Addi...';
    btn.disabled = true;

    console.log('🚀 [V3] Iniciando checkout con Addi...');

    try {
        const cleanStr = (str) => {
            if (!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
        };

        const cleanPhone = customer.phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
        const totalAmount = Math.round(checkoutCart.reduce((sum, item) => sum + (parseInt(item.price.replace(/[^0-9]/g, '')) * item.quantity), 0) + SHIPPING_COST);

        const payload = {
            orderData: {
                allySlug: "tennisymasco-ecommerce",
                orderId: "TM-" + Date.now(),
                totalAmount: totalAmount,
                currency: "COP",
                shippingAddress: {
                    line1: cleanStr(customer.address) || "CALLE 123",
                    city: cleanStr(customer.city) || "BOGOTA",
                    administrativeDivision: cleanStr(customer.department) || cleanStr(customer.city),
                    country: "CO"
                },
                client: {
                    idType: "CC",
                    idNumber: String(customer.dni).trim(),
                    firstName: cleanStr(customer.firstName),
                    lastName: cleanStr(customer.lastName),
                    email: String(customer.email).trim().toLowerCase(),
                    cellphone: finalPhone
                },
                redirectionUrls: {
                    success: window.location.origin + "/success.html",
                    failure: window.location.href,
                    cancel: window.location.href,
                    abandoned: window.location.href,
                    declined: window.location.href
                },
                items: [{
                    sku: "REF-001",
                    name: "COMPRA TENIS Y MAS CO",
                    quantity: 1,
                    unitPrice: totalAmount,
                    category: "Fashion"
                }]
            }
        };

        const response = await fetch('https://nrlaadaggmpjtdmtntoz.supabase.co/functions/v1/addi-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('📦 [V3] Respuesta del servidor:', result);

        if (result.redirectionUrl) {
            console.log('✅ Redirigiendo a Addi...');
            window.location.href = result.redirectionUrl;
        } else {
            console.error('❌ [V3] Error Crítico de Addi:', result);

            // Si hay detalles específicos de validación, los mostramos en consola
            if (result.details) {
                console.error('🔍 Detalles de validación:', result.details);
            }

            const errorMsg = result.details?.message || result.error || "Error desconocido";
            alert(`Error de Addi: ${errorMsg}\n\nRevisando detalles en consola... redirigiendo a WhatsApp.`);


            try {
                const customerData = {
                    firstName: document.getElementById('firstName')?.value || "Cliente",
                    lastName: document.getElementById('lastName')?.value || "",
                    city: document.getElementById('city')?.value || "No especificada",
                    department: document.getElementById('department')?.options[document.getElementById('department').selectedIndex]?.text || "No especificado",
                    address: document.getElementById('address')?.value || "No especificada"
                };
                handleWhatsAppFallback(customerData);
            } catch (e) {
                handleWhatsAppFallback({ firstName: "Cliente", lastName: "", city: "", department: "", address: "" });
            }
        }
    } catch (err) {
        console.error('❌ [V3] Error General:', err);
        alert('Hubo un inconveniente técnico. Te redirigiremos a WhatsApp directamente.');
        handleWhatsAppFallback({ firstName: "Cliente", lastName: "", city: "", department: "", address: "" });
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// ==================== MERCADO PAGO INTEGRATION ====================

// ==================== MERCADO PAGO REDIRECTION FLOW ====================

async function handleMercadoPagoCheckout(customer) {
    const btn = document.querySelector('.btn-checkout-final');
    const originalText = btn.textContent;
    btn.textContent = 'Redirigiendo a Mercado Pago...';
    btn.disabled = true;

    console.log('🚀 Iniciando checkout con Mercado Pago (Redirect)...');

    try {
        const getAbsoluteUrl = (url) => {
            if (!url) return "";
            if (url.startsWith('http')) return url;
            return window.location.origin + (url.startsWith('/') ? '' : '/') + url;
        };

        const items = checkoutCart.map(item => ({
            id: item.id,
            name: item.name,
            price: parseInt(item.price.replace(/[^0-9]/g, '')),
            quantity: item.quantity,
            image: getAbsoluteUrl(item.image)
        }));

        items.push({
            name: "Costo de Envío",
            price: SHIPPING_COST,
            quantity: 1
        });

        const payload = {
            orderId: "TM-" + Date.now(),
            customer: customer,
            items: items
        };

        const response = await fetch('https://nrlaadaggmpjtdmtntoz.supabase.co/functions/v1/mercadopago-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('🎫 Respuesta de MP:', result);

        if (result.init_point) {
            console.log('✅ Redirigiendo a Pasarela Oficial...');
            window.location.href = result.init_point;
        } else {
            throw new Error("No se obtuvo el punto de inicio (init_point)");
        }
    } catch (error) {
        console.error('❌ Error en Mercado Pago Checkout:', error);
        alert('Hubo un problema al conectar con Mercado Pago. Intentando por WhatsApp...');
        handleWhatsAppFallback(customer);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}


async function handleWhatsAppFallback(customer) {
    const WHATSAPP_NUMBER = '573204961453';
    let message = `Hola! Realizo mi pedido por la web:\n\n`;
    message += `👤 *Cliente:* ${customer.firstName || "Cliente"} ${customer.lastName || ""}\n`;
    message += `📍 *Ciudad:* ${customer.city || "No especificada"}, ${customer.department || "No especificado"}\n`;
    message += `🏠 *Dirección:* ${customer.address || "No especificada"}\n\n`;

    let total = 0;
    const orderItems = checkoutCart.map(item => {
        const itemPrice = parseInt(item.price.replace(/[^0-9]/g, ''));
        total += itemPrice * item.quantity;
        message += `📦 *${item.quantity}x ${item.name}*\n`;
        return {
            name: item.name,
            quantity: item.quantity,
            price: itemPrice,
            size: item.size || null
        };
    });

    const finalTotal = total + SHIPPING_COST;
    message += `\n💰 *TOTAL: $${finalTotal.toLocaleString('es-CO')}*`;

    // (NUEVO) Registrar en la base de datos de pedidos
    try {
        if (window.supabaseClient) {
            await window.supabaseClient.from('orders').insert([{
                customer_info: customer,
                items: orderItems,
                total: finalTotal,
                payment_method: 'whatsapp',
                status: 'pending'
            }]);
            console.log('✅ Pedido por WhatsApp registrado');
        }
    } catch (e) {
        console.error('Error registrando pedido WhatsApp:', e);
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
