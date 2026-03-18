console.log('%c🚀 ADDI CORE ENGINE V3.0 ACTIVATED', 'color: #00ff00; font-weight: bold; font-size: 16px; background: black; padding: 5px;');
// ==================== CHECKOUT LOGIC FOR ADDI ====================

let checkoutCart = [];
const DEFAULT_SHIPPING_COST = 16500;
const FREE_SHIPPING_THRESHOLD = 250000;

const colombiaCities = {
    "Amazonas": ["Leticia", "Puerto Nariño"],
    "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Rionegro", "Turbo", "Caucasia", "Caldas", "Chigorodó", "La Estrella", "Girardota", "Marinilla", "Sabaneta", "Santa Rosa de Osos"],
    "Arauca": ["Arauca", "Tame", "Saravena", "Arauquita"],
    "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Baranoa", "Galapa", "Puerto Colombia"],
    "Bogotá DC": ["Bogotá DC"],
    "Bolívar": ["Cartagena de Indias", "Magangué", "Turbaco", "Arjona", "Carmen de Bolívar"],
    "Boyacá": ["Tunja", "Sogamoso", "Duitama", "Chiquinquirá", "Puerto Boyacá"],
    "Caldas": ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio"],
    "Caquetá": ["Florencia", "San Vicente del Caguán", "Puerto Rico"],
    "Casanare": ["Yopal", "Aguazul", "Paz de Ariporo", "Villanueva"],
    "Cauca": ["Popayán", "Santander de Quilichao", "Puerto Tejada", "El Tambo"],
    "Cesar": ["Valledupar", "Aguachica", "Agustín Codazzi", "Bosconia"],
    "Chocó": ["Quibdó", "Istmina", "Condoto"],
    "Córdoba": ["Montería", "Cereté", "Sahagún", "Lorica", "Montelíbano", "Planeta Rica"],
    "Cundinamarca": ["Soacha", "Fusagasugá", "Facatativá", "Zipaquirá", "Chía", "Girardot", "Mosquera", "Madrid", "Funza", "Cajicá", "Sibaté", "Tocancipá"],
    "Guainía": ["Inírida"],
    "Guaviare": ["San José del Guaviare", "Retorno"],
    "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata"],
    "La Guajira": ["Riohacha", "Maicao", "Uribia", "Manaure", "San Juan del Cesar"],
    "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "El Banco", "Plato"],
    "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López"],
    "Nariño": ["Pasto", "Tumaco", "Ipiales", "Túquerres"],
    "Norte de Santander": ["Cúcuta", "Ocaña", "Villa del Rosario", "Los Patios", "Tibú", "Pamplona"],
    "Putumayo": ["Mocoa", "Orito", "Puerto Asís", "Valle del Guamuez"],
    "Quindío": ["Armenia", "Calarcá", "La Tebaida", "Montenegro", "Quimbaya"],
    "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"],
    "San Andrés y Providencia": ["San Andrés", "Providencia"],
    "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"],
    "Sucre": ["Sincelejo", "Corozal", "San Marcos"],
    "Tolima": ["Ibagué", "Espinal", "Chaparral", "Líbano", "Mariquita"],
    "Valle del Cauca": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Yumbo", "Cartago", "Buga", "Jamundí", "Candelaria", "Florida"],
    "Vaupés": ["Mitú"],
    "Vichada": ["Puerto Carreño", "Cumaribo"]
};

// ==================== MERCADO PAGO CONFIGURATION ====================
const MP_PUBLIC_KEY = 'APP_USR-c4eb2276-e656-4cc8-ad42-3135168127fe';
const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: 'es-CO' });
let selectorsSetup = false;


document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 DOM Loaded - V3 Engine Ready');
    loadCheckoutCart();
    setupPaymentSelectors();
    setupCheckoutForm();
    setupLocationSelectors();
});

function setupLocationSelectors() {
    const deptSelect = document.getElementById('department');
    const citySelect = document.getElementById('city');

    if (deptSelect && citySelect) {
        deptSelect.addEventListener('change', () => {
            const dept = deptSelect.value;
            const cities = colombiaCities[dept] || [];

            // Reset and enable
            citySelect.innerHTML = '<option value="" disabled selected>Ciudad / Municipio</option>';
            citySelect.disabled = false;

            cities.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });

            // If only one city (like Bogota), select it automatically
            if (cities.length === 1) {
                citySelect.value = cities[0];
            }
        });
    }
}

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
    const shippingEl = document.getElementById('summaryShipping');
    const totalEl = document.getElementById('summaryTotal');
    if (!listContainer) return;

    let subtotal = 0;
    listContainer.innerHTML = checkoutCart.map(item => {
        let priceValue = 0;
        if (typeof item.price === 'number') {
            priceValue = item.price;
        } else {
            priceValue = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        }
        const itemTotal = priceValue * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="checkout-item-row">
                <div class="item-img-wrapper">
                    <img src="${item.image}" alt="${item.name}">
                    <span class="item-qty-badge">${item.quantity}</span>
                </div>
                <div class="item-info-row">
                    <h4>${item.name}</h4>
                    ${item.size ? `<span class="item-meta">Talla: ${item.size}</span>` : ''}
                </div>
                <div class="item-price-final">
                    $${itemTotal.toLocaleString('es-CO')}
                </div>
            </div>
        `;
    }).join('');

    // Dynamic Shipping
    const currentShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
    const total = subtotal + currentShipping;

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-CO')}`;
    
    if (shippingEl) {
        if (currentShipping === 0) {
            shippingEl.innerHTML = '<span style="color: #2ecc71; font-weight: bold;">GRATIS</span>';
        } else {
            shippingEl.textContent = `$${currentShipping.toLocaleString('es-CO')}`;
        }
    }
    
    if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CO')}`;
}

function getShippingCost(subtotal) {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
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

        // Calcular total real
        const subtotal = checkoutCart.reduce((sum, item) => sum + (parseInt(item.price.replace(/[^0-9]/g, '')) * item.quantity), 0);
        const currentShipping = getShippingCost(subtotal);
        const totalAmount = Math.round(subtotal + currentShipping);

        // Mapear items reales para Addi
        const addiItems = checkoutCart.map(item => ({
            sku: String(item.id || "REF-001"),
            name: cleanStr(item.name).slice(0, 100),
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseInt(item.price.replace(/[^0-9]/g, '')),
            category: "Fashion"
        }));

        const payload = {
            orderData: {
                testMode: true,
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
                    failure: window.location.origin + "/checkout.html",
                    cancel: window.location.origin + "/checkout.html"
                },
                items: addiItems
            }
        };

        const response = await fetch('https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/addi-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('📦 [V3] Respuesta del servidor:', result);

        // Addi V3 puede retornar redirectionUrl o checkoutUrl
        const redirectUrl = result.redirectionUrl || result.checkoutUrl;

        if (redirectUrl) {
            console.log('✅ Redirigiendo a Addi:', redirectUrl);
            window.location.href = redirectUrl;
        } else {
            console.error('❌ [V3] Error Crítico de Addi:', result);

            // Log full details for debugging
            if (result.details) {
                console.log('🔍 Detalles del error Addi:', JSON.stringify(result.details, null, 2));
            }
            if (result.called_url) {
                console.log('🔗 URL llamada:', result.called_url);
            }

            const errorMsg = result.details?.message || result.error || "Error de respuesta del servidor";
            alert(`Error de Addi (Status ${result.status}): ${errorMsg}\n\nPor favor, revisa la consola del navegador para ver los detalles técnicos y envíame una captura.`);

            handleWhatsAppFallback(customer);
        }
    } catch (err) {
        console.error('❌ [V3] Error General:', err);
        alert('Hubo un inconveniente técnico con Addi. Te redirigiremos a WhatsApp para finalizar tu compra.');
        handleWhatsAppFallback(customer);
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

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const currentShipping = getShippingCost(subtotal);

        items.push({
            name: "Costo de Envío",
            price: currentShipping,
            quantity: 1
        });

        const payload = {
            orderId: "TM-" + Date.now(),
            customer: customer,
            items: items
        };

        const response = await fetch('https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/mercadopago-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
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

    const currentShipping = getShippingCost(total);
    const finalTotal = total + currentShipping;
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
