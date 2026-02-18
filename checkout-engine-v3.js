console.log('%c🚀 ADDI CORE ENGINE V3.0 ACTIVATED', 'color: #00ff00; font-weight: bold; font-size: 16px; background: black; padding: 5px;');
// ==================== CHECKOUT LOGIC FOR ADDI ====================

let checkoutCart = [];
const SHIPPING_COST = 16500;

// ==================== WOMPI CONFIGURATION ====================
const WOMPI_PUBLIC_KEY = 'pub_prod_KVXCvqA1WbupHGHkYRwSOpwkYnPrqu2d';
const WOMPI_INTEGRITY_SECRET = 'prod_integrity_71mRhaicKJUmSjsjIJcUu8WMDFWXUgmM';


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
    const cards = document.querySelectorAll('.payment-method-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
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
            } else if (selectedMethod === 'wompi') {
                handleWompiCheckout(customerData);
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

// ==================== WOMPI INTEGRATION ====================

async function generateWompiSignature(reference, amountInCents, currency, secret) {
    const message = `${reference}${amountInCents}${currency}${secret}`;
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleWompiCheckout(customer) {
    const btn = document.querySelector('.btn-checkout-final');
    const originalText = btn.textContent;
    btn.textContent = 'Abriendo Wompi...';
    btn.disabled = true;

    try {
        const subtotal = checkoutCart.reduce((sum, item) => {
            const price = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
            return sum + (price * item.quantity);
        }, 0);
        const totalAmount = subtotal + SHIPPING_COST;
        const amountInCents = totalAmount * 100;
        const currency = 'COP';
        const reference = `TM-${Date.now()}`;

        console.log('🔐 Generando firma de integridad Wompi...');
        const signature = await generateWompiSignature(reference, amountInCents, currency, WOMPI_INTEGRITY_SECRET);

        const checkout = new WidgetCheckout({
            currency: currency,
            amountInCents: amountInCents,
            reference: reference,
            publicKey: WOMPI_PUBLIC_KEY,
            signature: { integrity: signature },
            customerData: {
                email: customer.email,
                fullName: `${customer.firstName} ${customer.lastName}`,
                phoneNumber: customer.phone,
                phoneNumberPrefix: '+57'
            },
            shippingAddress: {
                addressLine1: customer.address,
                city: customer.city,
                phoneNumber: customer.phone,
                region: customer.department,
                country: 'CO'
            }
        });

        checkout.open(function (result) {
            const transaction = result.transaction;
            console.log('Transaction ID: ', transaction.id);
            console.log('Transaction status: ', transaction.status);
            if (transaction.status === 'APPROVED') {
                window.location.href = 'success.html';
            }
        });

    } catch (err) {
        console.error('❌ Error abriendo Wompi:', err);
        alert('Hubo un error al iniciar el pago con Wompi. Por favor intenta de nuevo o usa otro método.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}


function handleWhatsAppFallback(customer) {
    const WHATSAPP_NUMBER = '573204961453';
    let message = `Hola! Realizo mi pedido por la web:\n\n`;
    message += `👤 *Cliente:* ${customer.firstName || "Cliente"} ${customer.lastName || ""}\n`;
    message += `📍 *Ciudad:* ${customer.city || "No especificada"}, ${customer.department || "No especificado"}\n`;
    message += `🏠 *Dirección:* ${customer.address || "No especificada"}\n\n`;

    let total = 0;
    checkoutCart.forEach(item => {
        const itemTotal = parseInt(item.price.replace(/[^0-9]/g, '')) * item.quantity;
        total += itemTotal;
        message += `📦 *${item.quantity}x ${item.name}*\n`;
    });

    message += `\n💰 *TOTAL: $${(total + SHIPPING_COST).toLocaleString('es-CO')}*`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}
