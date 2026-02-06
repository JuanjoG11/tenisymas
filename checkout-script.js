// Checkout Logic
let checkoutCart = [];
const SHIPPING_COST = 16500;

document.addEventListener('DOMContentLoaded', () => {
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
        // Redirect back if cart is empty
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

            const selectedMethod = document.querySelector('.payment-method-card.active').dataset.method;
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
            } else if (selectedMethod === 'whatsapp') {
                handleWhatsAppFallback(customerData);
            } else {
                alert('Método de pago en mantenimiento. Por ahora usa WhatsApp o Addi.');
            }
        });
    }
}

async function handleAddiCheckout(customer) {
    // Show loading state on button
    const btn = document.querySelector('.btn-checkout-final');
    const originalText = btn.textContent;
    btn.textContent = 'Procesando con Addi...';
    btn.disabled = true;

    console.log('🚀 Iniciando checkout con Addi para:', customer);

    try {
        // Here we would call the Supabase Edge Function
        // For now, redirect to a mock/whatsapp if we don't have the API set up

        // MOCK: simulate server delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // alert('Redirigiendo a Addi... (Necesitaremos configurar tus credenciales en Supabase para el paso final)');

        // Fallback to WhatsApp but notifying it's for Addi
        const WHATSAPP_NUMBER = '573204961453';
        let message = `Hola! Quiero pagar con ADDI mi pedido:\n\n`;
        message += `👤 *Cliente:* ${customer.firstName} ${customer.lastName}\n`;
        message += `🆔 *Cédula:* ${customer.dni}\n`;
        message += `📍 *Ciudad:* ${customer.city}\n\n`;
        message += `🛒 *RESUMEN DE COMPRA:*\n`;

        let total = 0;
        checkoutCart.forEach(item => {
            const itemTotal = parseInt(item.price.replace(/[^0-9]/g, '')) * item.quantity;
            total += itemTotal;
            message += `📦 *${item.quantity}x ${item.name}*\n`;
        });

        message += `\n💰 *TOTAL: $${(total + SHIPPING_COST).toLocaleString('es-CO')}*`;

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

    } catch (err) {
        console.error('Error Addi:', err);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function handleWhatsAppFallback(customer) {
    const WHATSAPP_NUMBER = '573204961453';
    let message = `Hola! Realizo mi pedido por la web:\n\n`;
    message += `👤 *Cliente:* ${customer.firstName} ${customer.lastName}\n`;
    message += `📍 *Ciudad:* ${customer.city}, ${customer.department}\n`;
    message += `🏠 *Dirección:* ${customer.address}\n\n`;

    let total = 0;
    checkoutCart.forEach(item => {
        const itemTotal = parseInt(item.price.replace(/[^0-9]/g, '')) * item.quantity;
        total += itemTotal;
        message += `📦 *${item.quantity}x ${item.name}*\n`;
    });

    message += `\n💰 *TOTAL: $${(total + SHIPPING_COST).toLocaleString('es-CO')}*`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
