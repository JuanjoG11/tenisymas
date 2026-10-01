// Product Data
if (typeof products === 'undefined') { var products = []; }

// Supabase Configuration
if (typeof SUPABASE_URL === 'undefined') { var SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co'; }
if (typeof SUPABASE_KEY === 'undefined') { var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ'; }
if (typeof supabaseClient === 'undefined') {
    var supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: false
        }
    }) : (window.supabaseClient || null);
    window.supabaseClient = supabaseClient;
}

// ==================== IMAGE ENGINE (AUTOMATIC BUCKET LISTING) ====================
async function getImagesFromFolder(folder) {
    if (!supabaseClient) return [];
    try {
        // 1. Llama a la API de Supabase para listar archivos en la carpeta
        const { data, error } = await supabaseClient.storage
            .from('product-images') 
            .list(folder);

        if (error) {
            console.warn('Error listing images from folder:', folder, error);
            return [];
        }

        // 2. Filtra solo archivos de imagen (jpg, png, webp)
        const imageFiles = data.filter(file => /\.(jpg|jpeg|png|webp|jfif)$/i.test(file.name));

        // 3. Retorna las URLs completas
        // Base URL for Supabase Storage public buckets: 
        // https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET]/[FOLDER]/[FILE]
        const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/product-images/`;
        return imageFiles.map(file => `${STORAGE_BASE}${folder}/${file.name}`);
    } catch (err) {
        console.error('getImagesFromFolder failed:', err);
        return [];
    }
}
window.getImagesFromFolder = getImagesFromFolder;

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Auto-fix: limpia caché si tiene URLs con extensión doble (.jpg.jpeg)
    try {
        const cached = localStorage.getItem('productsCache_v10');
        if (cached) {
            const parsed = JSON.parse(cached);
            const data = parsed.data || parsed;
            if (Array.isArray(data)) {
                const hasBadUrls = data.some(p => 
                    (p.image && p.image.includes('.jpg.jpeg')) ||
                    (Array.isArray(p.images) && p.images.some(img => img && img.includes('.jpg.jpeg')))
                );
                if (hasBadUrls) {
                    console.log('⚠️ Cache con URLs corruptas detectado, limpiando...');
                    localStorage.removeItem('productsCache_v10');
                    localStorage.removeItem('productsCache_Time');
                }
            }
        }
    } catch(e) { /* ignore */ }

    // 1. Initialize State
    loadCart();

    // 2. Render Sections
    // 2. Render Sections (Removed: Homepage is navigational only)

    // 3. Setup UI Interactions
    setupCartInteractions();
    setupSlider();
    setupMobileMenu();
    setupSmoothScroll();
    setupHeroBackgroundSlider();
    setupHomeSearch();

    // 4. Sync with Supabase (Singleton promise)
    window.productsLoaded = syncProducts();

    // 5. Reveal WhatsApp Button after Intro
    setTimeout(() => {
        const waBtn = document.querySelector('.whatsapp-float');
        if (waBtn) waBtn.classList.add('visible');
    }, 2000); // Reduced from 3500ms
});

function setupHomeSearch() {
    const searchForm = document.getElementById('homeSearchForm');
    const searchInput = document.getElementById('homeSearchInput');
    
    if (!searchForm || !searchInput) return;

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `collections.html?search=${encodeURIComponent(query)}`;
        }
    });
}

// ==================== HERO BACKGROUND SLIDER ====================
function setupHeroBackgroundSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;

    let currentSlide = 0;
    const intervalTime = 3000; // 3 seconds

    // Lazy-load: load each slide's bg only when it's about to become active
    function loadSlideBg(slide) {
        const bg = slide.dataset.bg;
        if (bg && !slide.style.backgroundImage) {
            slide.style.backgroundImage = `url('${bg}')`;
        }
    }

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        loadSlideBg(slides[currentSlide]); // Load on demand
        slides[currentSlide].classList.add('active');
    }, intervalTime);
}


// ==================== STATE MANAGEMENT ====================
if (typeof cart === 'undefined') { var cart = []; }

function loadCart() {
    try {
        const savedCart = localStorage.getItem('tm_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            if (!Array.isArray(cart)) cart = [];
        }
    } catch (e) {
        console.error('Error loading cart:', e);
        cart = [];
    }
    updateCartUI();
}

function saveCart() {
    try {
        localStorage.setItem('tm_cart', JSON.stringify(cart));
    } catch (e) {
        console.warn('Error saving cart to localStorage:', e);
    }
    updateCartUI();
}

// ==================== RENDERING ====================
function renderHomepageSections() {
    // Content removed - homepage is navigational only
}

function formatDisplayPrice(price) {
    if (!price || price === '0' || price === 0 || price === '$0' || price === '0.00') return '$0';
    
    if (typeof price === 'number') {
        return '$' + price.toLocaleString('es-CO');
    }
    
    // Si es un string con números, extraerlos y formatearlos
    if (typeof price === 'string') {
        const cleanDigits = price.replace(/[^\d]/g, '');
        if (cleanDigits) {
            return '$' + parseInt(cleanDigits, 10).toLocaleString('es-CO');
        }
    }
    
    return price;
}

function renderProductGrid(containerId, category) {
    const container = document.getElementById(containerId);
    if (!container) return; // Container might not exist if we changed HTML structure, fail gracefully

    const filteredProducts = products.filter(p => (p.category || p.categoria) === category);

    if (filteredProducts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:white; opacity:0.7;">Próximamente más productos.</p>';
        return;
    }

    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price-container">
                    ${product.oldPrice || product.oldprice || product.old_price || product.precio_anterior ? `<span class="product-old-price">${formatDisplayPrice(product.oldPrice || product.oldprice || product.old_price || product.precio_anterior)}</span>` : ''}
                    <span class="product-price">${formatDisplayPrice(product.price || product.precio)}</span>
                </div>
                <addi-widget price="${(product.price || product.precio || '0').toString().replace(/[^0-9]/g, '') || '0'}" ally-slug="tennisymasco-ecommerce"></addi-widget>
                <button class="product-btn" onclick="addToCart(${product.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <span>Agregar al Carrito</span>
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== CART LOGIC ====================
function addToCart(productId, size = null, color = null, qty = 1) {
    // Check local 'products' array
    let product = products.find(p => String(p.id) === String(productId));
    
    // Check 'allProducts' array (Collections page)
    if (!product && typeof window.allProducts !== 'undefined') {
        product = window.allProducts.find(p => String(p.id) === String(productId));
    }
    // Check specific collections global if available
    if (!product && typeof allProducts !== 'undefined') {
        product = allProducts.find(p => String(p.id) === String(productId));
    }
    
    if (!product) {
        console.warn('[CART] Product not found:', productId);
        if (typeof showNotification === 'function') {
            showNotification('Error al agregar: Producto no encontrado ❌', 'error');
        }
        return;
    }

    console.log('[CART] Adding:', product.name, 'Size:', size, 'Qty:', qty);

    // For products with sizes/colors, find existing item with same size AND color
    // For products without, find by ID only
    const existingItem = (size || color)
        ? cart.find(item => item.id === productId && item.size === size && item.color === color)
        : cart.find(item => item.id === productId && !item.size && !item.color);

    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price || product.precio,
            image: product.image,
            quantity: qty
        };

        // Add size if provided
        if (size) {
            cartItem.size = size;
        }

        // Add color if provided
        if (color) {
            cartItem.color = color;
        }

        cart.push(cartItem);
    }

    saveCart();
    
    // Auto open cart with a tiny delay to ensure everything rendered
    setTimeout(() => {
        if (typeof openCart === 'function') openCart();
    }, 50);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

function updateQuantity(index, change) {
    const item = cart[index];
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(index);
    } else {
        saveCart();
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotalItems = document.getElementById('cartTotalItems');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!cartCount || !cartItems) return; // Safety check

    // Update Counts
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalQty;
    if (cartTotalItems) cartTotalItems.textContent = `(${totalQty})`;

    // Check for applied discount
    let appliedDiscount = null;
    try {
        const saved = sessionStorage.getItem('tm_discount') || localStorage.getItem('tm_discount');
        if (saved) {
            appliedDiscount = JSON.parse(saved);
        }
    } catch (e) {
        appliedDiscount = null;
    }

    // Update Items List
    if (cart.length === 0) {
        if (cartItems) cartItems.innerHTML = '<div class="empty-cart-msg">Tu carrito está vacío 🛒</div>';
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.5';
        }
    } else {
        if (cartItems) {
            let discountHtml = '';
            if (appliedDiscount && appliedDiscount.percent > 0) {
                discountHtml = `
                    <div class="applied-discount-banner">
                        <span>🎁 Cupón <strong>${appliedDiscount.code} (-${appliedDiscount.percent}%)</strong> aplicado</span>
                        <button class="remove-discount-btn" onclick="removeActiveDiscount()" title="Quitar descuento">&times;</button>
                    </div>
                `;
            }

            cartItems.innerHTML = discountHtml + cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        ${item.size ? `<p class="item-size">Talla: <strong>${item.size}</strong></p>` : ''}
                        ${item.color ? `<p class="item-color">Color: <strong>${item.color}</strong></p>` : ''}
                        <p>${formatDisplayPrice(item.price)}</p>
                        <div class="item-controls">
                            <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                        </div>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">&times;</button>
                </div>
            `).join('');
        }
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.opacity = '1';
        }
    }

    // Update Total Price (Parsing currency string like "$250.000")
    const subtotal = cart.reduce((sum, item) => {
        let price = 0;
        if (typeof item.price === 'number') {
            price = item.price;
        } else if (typeof item.price === 'string' && item.price) {
            price = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        }
        return sum + (price * item.quantity);
    }, 0);

    let finalTotal = subtotal;
    if (appliedDiscount && appliedDiscount.percent > 0) {
        const discountVal = (subtotal * appliedDiscount.percent) / 100;
        finalTotal = Math.max(0, Math.round(subtotal - discountVal));
        if (cartTotalPrice) {
            cartTotalPrice.innerHTML = `<span style="text-decoration: line-through; opacity: 0.6; font-size: 0.85em; margin-right: 8px;">$${subtotal.toLocaleString('es-CO')}</span>$${finalTotal.toLocaleString('es-CO')}`;
        }
    } else {
        if (cartTotalPrice) cartTotalPrice.textContent = `$${finalTotal.toLocaleString('es-CO')}`;
    }

    // Update Shipping Goal
    updateShippingGoal(subtotal);
}

function removeActiveDiscount() {
    sessionStorage.removeItem('tm_discount');
    localStorage.removeItem('tm_discount');
    updateCartUI();
}

function updateShippingGoal(total) {
    const shippingMsg = document.getElementById('shippingMsg');
    const shippingProgress = document.getElementById('shippingProgress');
    const FREE_SHIPPING_THRESHOLD = 300000;

    if (!shippingMsg || !shippingProgress) return;

    if (total === 0) {
        shippingMsg.innerHTML = `¡Estás a <strong>$300.000</strong> del <strong>ENVÍO GRATIS</strong>! 🚚`;
        shippingProgress.style.width = '0%';
        return;
    }

    if (total >= FREE_SHIPPING_THRESHOLD) {
        shippingMsg.innerHTML = `🌟 ¡Felicidades! Tienes <strong>ENVÍO GRATIS</strong> 🌟`;
        shippingProgress.style.width = '100%';
        shippingProgress.style.background = 'linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)';
    } else {
        const remaining = FREE_SHIPPING_THRESHOLD - total;
        const percent = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
        shippingMsg.innerHTML = `¡Estás a <strong>$${remaining.toLocaleString('es-CO')}</strong> del <strong>ENVÍO GRATIS</strong>! 🚚`;
        shippingProgress.style.width = `${percent}%`;
        shippingProgress.style.background = 'linear-gradient(90deg, #ff3333 0%, #ff6666 100%)';
    }
}

if (typeof urgencyTimerInterval === 'undefined') { var urgencyTimerInterval = null; }

function startUrgencyTimer() {
    if (urgencyTimerInterval) clearInterval(urgencyTimerInterval);

    let timeLeft = 600; // 10 minutes (600 seconds)
    const timerDisplay = document.getElementById('urgencyTimer');
    const timerBanner = document.getElementById('cartUrgencyTimer');

    if (!timerDisplay || !timerBanner) return;

    if (cart.length === 0) {
        timerBanner.style.display = 'none';
        return;
    }

    timerBanner.style.display = 'block';

    const updateDisplay = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(urgencyTimerInterval);
            timerDisplay.textContent = "0:00";
            // Optional: Action when timer ends
        }
        timeLeft--;
    };

    updateDisplay();
    urgencyTimerInterval = setInterval(updateDisplay, 1000);
}

function setupCartInteractions() {
    const cartBtn = document.getElementById('cartBtn');
    const closeCart = document.getElementById('closeCart');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (closeCart) closeCart.addEventListener('click', handleCartDrawerCloseRequest);
    if (cartOverlay) cartOverlay.addEventListener('click', handleCartDrawerCloseRequest);

    // New Integrated Checkout Elements
    const btnGoToCheckout = document.getElementById('btnGoToCheckout');
    const btnBackToCart = document.getElementById('btnBackToCart');
    const checkoutForm = document.getElementById('integratedCheckoutForm');

    if (btnGoToCheckout) {
        btnGoToCheckout.addEventListener('click', () => {
            window.location.href = 'checkout.html';
        });
    }

    if (btnBackToCart) {
        btnBackToCart.addEventListener('click', () => {
            document.getElementById('checkoutView').style.display = 'none';
            document.getElementById('cartView').style.display = 'block';

            const timer = document.getElementById('cartUrgencyTimer');
            const shipBar = document.querySelector('.cart-shipping-bar');
            if (timer && cart.length > 0) timer.style.display = 'block';
            if (shipBar) shipBar.style.display = 'block';
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleIntegratedCheckout();
        });
    }

    // Setup Exit Intent detection for Cart Recovery
    setupExitIntent();
}

function handleIntegratedCheckout() {
    if (cart.length === 0) return;

    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const city = document.getElementById('custCity').value;
    const address = document.getElementById('custAddress').value;

    const WHATSAPP_NUMBER = '573204961453';
    let message = `Hola! Quiero realizar el siguiente pedido:\n\n`;
    message += `👤 *Cliente:* ${name}\n`;
    message += `📞 *Tel:* ${phone}\n`;
    message += `📍 *Ciudad:* ${city}\n`;
    message += `🏠 *Dirección:* ${address}\n\n`;
    message += `🛒 *PEDIDO:*\n`;

    let total = 0;
    cart.forEach(item => {
        let itemPrice = 0;
        if (typeof item.price === 'number') {
            itemPrice = item.price;
        } else if (typeof item.price === 'string' && item.price) {
            itemPrice = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        }
        const itemTotal = itemPrice * item.quantity;
        total += itemTotal;
        message += `📦 *${item.quantity}x ${item.name}* ${item.size ? `(Talla: ${item.size})` : ''} ${item.color ? `(Color: ${item.color})` : ''}\n`;
    });

    message += `\n💰 *TOTAL GLOBAL: $${total.toLocaleString('es-CO')}*\n\n¿Quedo atento a la confirmación!`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function openCart() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
    startUrgencyTimer();
}

function closeCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function handleCartDrawerCloseRequest() {
    closeCartDrawer();
    // If user has items in cart and hasn't claimed/dismissed recovery yet, show the 5% offer!
    const hasDiscount = sessionStorage.getItem('tm_discount') || localStorage.getItem('tm_discount');
    const declined = sessionStorage.getItem('cart_recovery_declined');
    if (cart.length > 0 && !hasDiscount && !declined) {
        setTimeout(() => {
            showCartRecoveryModal();
        }, 300);
    }
}

// ==================== CART RECOVERY OFFER (5% OFF) ====================
let recoveryTimerInterval = null;

function ensureCartRecoveryModal() {
    let overlay = document.getElementById('cartRecoveryOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cartRecoveryOverlay';
        overlay.className = 'cart-recovery-overlay';
        overlay.innerHTML = `
            <div class="cart-recovery-modal">
                <button class="recovery-close-btn" onclick="closeCartRecoveryModal(true)">&times;</button>
                <div class="recovery-badge-wrapper">
                    <span class="recovery-badge">🔥 OFERTA EXCLUSIVA</span>
                </div>
                <h3 class="recovery-title">¡ESPERA! NO TE VAYAS CON LAS MANOS VACÍAS ⚡</h3>
                <p class="recovery-description">
                    Lleva tus tenis favoritos hoy mismo con un <strong class="recovery-highlight">5% DE DESCUENTO ADICIONAL</strong> exclusivo.
                </p>
                <div class="recovery-timer-box">
                    ⏱️ OFERTA VÁLIDA POR: <span id="recoveryCountdown">09:59</span>
                </div>
                <div class="recovery-coupon-card">
                    <div>
                        <div style="font-size: 0.8rem; color: #aaa; text-transform: uppercase;">Cupón Especial</div>
                        <div class="recovery-coupon-code">RECUPERA5</div>
                    </div>
                    <span class="recovery-coupon-tag">-5% OFF DIRECTO</span>
                </div>
                <button class="btn-recovery-action" onclick="applyCartRecoveryDiscount()">
                    ⚡ APLICAR 5% Y CONTINUAR MI COMPRA
                </button>
                <div>
                    <button class="recovery-dismiss-link" onclick="closeCartRecoveryModal(true)">
                        No gracias, prefiero pagar precio completo
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeCartRecoveryModal(true);
            }
        });
    }
    return overlay;
}

function showCartRecoveryModal() {
    if (cart.length === 0) return;
    const hasDiscount = sessionStorage.getItem('tm_discount') || localStorage.getItem('tm_discount');
    if (hasDiscount) return;

    const overlay = ensureCartRecoveryModal();
    overlay.classList.add('active');

    // Start 10-min countdown timer
    let timeLeft = 599;
    const countdownEl = document.getElementById('recoveryCountdown');
    if (recoveryTimerInterval) clearInterval(recoveryTimerInterval);
    
    recoveryTimerInterval = setInterval(() => {
        if (!countdownEl) return;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        countdownEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if (timeLeft <= 0) {
            clearInterval(recoveryTimerInterval);
        }
        timeLeft--;
    }, 1000);
}

function closeCartRecoveryModal(declined = false) {
    const overlay = document.getElementById('cartRecoveryOverlay');
    if (overlay) overlay.classList.remove('active');
    if (recoveryTimerInterval) clearInterval(recoveryTimerInterval);
    if (declined) {
        sessionStorage.setItem('cart_recovery_declined', 'true');
    }
}

function applyCartRecoveryDiscount() {
    const discountData = { code: 'RECUPERA5', percent: 5 };
    sessionStorage.setItem('tm_discount', JSON.stringify(discountData));
    localStorage.setItem('tm_discount', JSON.stringify(discountData));
    
    closeCartRecoveryModal(false);
    updateCartUI();
    
    // Open cart drawer so user sees their new reduced total and applied badge
    setTimeout(() => {
        openCart();
    }, 200);
}

function setupExitIntent() {
    // Only bind on desktop mouse leave
    let exitTriggered = false;
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 15 && !exitTriggered && cart.length > 0) {
            const hasDiscount = sessionStorage.getItem('tm_discount') || localStorage.getItem('tm_discount');
            const declined = sessionStorage.getItem('cart_recovery_declined');
            if (!hasDiscount && !declined) {
                exitTriggered = true;
                showCartRecoveryModal();
            }
        }
    });
}

function checkout() {
    if (cart.length === 0) return;

    const WHATSAPP_NUMBER = '573204961453';
    let message = "Hola! Quiero realizar el siguiente pedido:\n\n";

    let total = 0;
    cart.forEach(item => {
        let itemPrice = 0;
        if (typeof item.price === 'number') {
            itemPrice = item.price;
        } else if (typeof item.price === 'string') {
            itemPrice = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        }
        const itemTotal = itemPrice * item.quantity;
        total += itemTotal;
        message += `📦 *${item.quantity}x ${item.name}*\n   Precio: $${itemPrice.toLocaleString('es-CO')}\n`;
    });

    message += `\n💰 *TOTAL GLOBAL: $${total.toLocaleString('es-CO')}*\n\n¿Me confirman disponibilidad?`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ==================== 3D CAROUSEL ====================
function setupSlider() {
    const cards = document.querySelectorAll('.carousel-card');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (cards.length === 0) return;

    let currentIndex = 0;
    // Set initial card index (0 = Guayos, etc)

    function updateCarousel() {
        cards.forEach((card, index) => {
            // Reset classes
            card.className = 'carousel-card';

            // Calculate distance from current index with wrapping
            let diff = (index - currentIndex) % cards.length;
            if (diff < 0) diff += cards.length;

            // Determine active, next, prev
            if (diff === 0) {
                card.classList.add('active');
            } else if (diff === 1) {
                card.classList.add('next');
            } else if (diff === cards.length - 1) {
                card.classList.add('prev');
            }
            // Others remain hidden via CSS
        });
    }

    function rotateNext() {
        currentIndex = (currentIndex + 1) % cards.length;
        updateCarousel();
    }

    function rotatePrev() {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        updateCarousel();
    }

    if (nextBtn) nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        rotateNext();
        resetTimer();
    });

    if (prevBtn) prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rotatePrev();
        resetTimer();
    });

    // Initial State
    updateCarousel();

    // Click on cards to rotate or navigate
    cards.forEach((card, index) => {
        card.addEventListener('click', (e) => {
            const cardIndex = parseInt(card.getAttribute('data-index'));
            const url = card.getAttribute('data-url');

            if (cardIndex === currentIndex) {
                // Focus: Navigate only if active
                if (url) window.location.href = url;
            } else {
                // Not active: Rotate to this card first
                currentIndex = cardIndex;
                updateCarousel();
                resetTimer();
            }
        });
    });

    // ==================== TOUCH/SWIPE SUPPORT ====================
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselSection = document.querySelector('.carousel-section');

    if (carouselSection) {
        carouselSection.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carouselSection.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleGesture();
        }, { passive: true });
    }

    function handleGesture() {
        const threshold = 50; // Minimum swipe distance
        const swipeDistance = touchEndX - touchStartX;

        if (swipeDistance < -threshold) {
            // Swiped Left -> Show Next
            rotateNext();
            resetTimer();
        } else if (swipeDistance > threshold) {
            // Swiped Right -> Show Prev
            rotatePrev();
            resetTimer();
        }
    }

    // Auto Play — cada 3.5s
    let timer = setInterval(rotateNext, 3500);

    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(rotateNext, 3500);
    }

    // Pause on hover
    const section = document.querySelector('.carousel-section');
    if (section) {
        section.addEventListener('mouseenter', () => clearInterval(timer));
        section.addEventListener('mouseleave', () => { timer = setInterval(rotateNext, 3500); });
    }
}

// ==================== UTILS ====================

// Mobile Menu
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        // Toggle Animation here if needed, or rely on CSS
        const spans = menuToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            if (spans[0]) spans[0].style.transform = 'rotate(45deg) translateY(8px)';
            if (spans[1]) spans[1].style.opacity = '0';
            if (spans[2]) spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
        } else {
            if (spans[0]) spans[0].style.transform = 'none';
            if (spans[1]) spans[1].style.opacity = '1';
            if (spans[2]) spans[2].style.transform = 'none';
        }
    });

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const spans = menuToggle.querySelectorAll('span');
            if (spans[0]) spans[0].style.transform = 'none';
            if (spans[1]) spans[1].style.opacity = '1';
            if (spans[2]) spans[2].style.transform = 'none';
        });
    });
}

// Smooth Scroll
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 85;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
}

// Supabase Sync (Kept from original)
if (typeof isSyncing === 'undefined') { var isSyncing = false; }
if (typeof syncPromise === 'undefined') { var syncPromise = null; }

async function syncProducts() {
    if (!supabaseClient) return [];
    if (isSyncing) return syncPromise;

    isSyncing = true;
    syncPromise = (async () => {
        const CACHE_KEY = 'productsCache_v10';
        const CACHE_TIME_KEY = 'productsCache_Time';
        // Background refresh every 5 minutes, but always serve cache immediately (stale-while-revalidate)
        const BG_REFRESH_INTERVAL = 30 * 1000; // 30 seconds for live feel

        const cachedData = localStorage.getItem(CACHE_KEY);
        const lastFetch = parseInt(localStorage.getItem(CACHE_TIME_KEY) || '0');
        const now = Date.now();
        const cacheIsFresh = lastFetch && (now - lastFetch < BG_REFRESH_INTERVAL);

        // 1. FAST PATH: Serve cache immediately (always, if available)
        const cacheTTL = 1000 * 60 * 60; // 1 hour (Increased for stability)
        if (cachedData) {
            try {
                const parsedCache = JSON.parse(cachedData);
                const timestamp = parsedCache.timestamp;
                const data = parsedCache.data;

                if (timestamp && (Date.now() - timestamp < cacheTTL)) {
                    console.log('[SYNC] Valid cache found, skipping network fetch.');
                    products = data; // Assuming 'products' is the global variable
                    renderHomepageSections(); // Assuming this is the correct render function
                    document.dispatchEvent(new CustomEvent('productsLoaded'));
                    isSyncing = false;
                    return products;
                }
                // If cache is very fresh, skip network fetch entirely and resolve now
                if (cacheIsFresh) {
                    document.dispatchEvent(new CustomEvent('productsLoaded'));
                    isSyncing = false;
                    return products;
                }
                // Otherwise: resolve the promise NOW with cache data so UI unblocks,
                // then do a background network refresh below
            } catch (e) {
                console.error('Cache parse failed', e);
            }
        }

        // 2. NETWORK PATH: Fetch from Supabase (background if we already had cache)
        try {
            // Fetch both products and inventory in parallel for speed
            const [prodRes, invRes] = await Promise.all([
                supabaseClient.from('products').select('*').order('created_at', { ascending: false }),
                supabaseClient.from('inventory').select('product_id, size, stock')
            ]);

            if (prodRes.error) throw prodRes.error;
            let data = prodRes.data;
            const inventoryData = invRes.data || [];

            if (data && data.length > 0) {
                // Attach inventory to each product
                data = data.map(p => ({
                    ...p,
                    inventory: inventoryData.filter(inv => inv.product_id === p.id)
                }));
                // Dedup: Ensure unique IDs
                const seen = new Set();
                const uniqueData = data.filter(p => {
                    if (seen.has(p.id)) return false;
                    seen.add(p.id);
                    return true;
                });
                products = uniqueData;

                    // Save cache in idle time to avoid blocking UI
                    const saveCache = () => {
                        try {
                            const cacheData = JSON.stringify({
                                timestamp: Date.now(),
                                data: products
                            });
                            localStorage.setItem('productsCache_v10', cacheData);
                            console.log('📦 Script.js: Cache updated in background');
                        } catch (storageErr) {
                            console.warn('[SYNC] localStorage full or failed:', storageErr);
                        }
                    };

                    if (window.requestIdleCallback) {
                        window.requestIdleCallback(saveCache, { timeout: 2000 });
                    } else {
                        setTimeout(saveCache, 100);
                    }

                renderHomepageSections();
                updateCategoryCardImages();
                console.log('✅ Script.js: Data synced', products.length);
                // Notificar que los productos están listos
                document.dispatchEvent(new CustomEvent('productsLoaded'));
            }
        } catch (err) {
            console.error('Supabase sync failed:', err);
        } finally {
            isSyncing = false;
        }
        return products;
    })();

    return syncPromise;
}

// ==================== DYNAMIC CATEGORY CARD IMAGES (LATEST UPLOAD) ====================
function updateCategoryCardImages() {
    if (!products || products.length === 0) return;

    const cards = document.querySelectorAll('.carousel-card');
    cards.forEach(card => {
        const url = card.getAttribute('data-url') || '';
        const img = card.querySelector('.card-image img');
        if (!img || !url) return;

        let categoryParam = null;
        let brandParam = null;
        try {
            const urlObj = new URL(url, window.location.href);
            categoryParam = urlObj.searchParams.get('category');
            brandParam = urlObj.searchParams.get('brand');
        } catch (e) {
            if (url.includes('category=')) categoryParam = url.split('category=')[1]?.split('&')[0];
            if (url.includes('brand=')) brandParam = url.split('brand=')[1]?.split('&')[0];
        }

        // Find the latest product uploaded that matches this category/brand
        // Since products array is sorted by created_at DESC, the first match is the newest product
        const latestProduct = products.find(p => {
            const pCat = (p.category || p.categoria || '').toLowerCase().trim();
            const pBrand = (p.brand || p.marca || '').toLowerCase().trim();
            const pName = (p.name || p.nombre || '').toLowerCase().trim();

            if (brandParam && brandParam.toLowerCase() === 'joma') {
                return pName.includes('joma') || pBrand.includes('joma');
            }

            if (categoryParam === 'max-sport') {
                return pCat === 'max-sport' || pName.includes('max ') || pName.startsWith('max') || pBrand.includes('max');
            }

            if (categoryParam === 'guayos') {
                return pCat === 'guayos' && !pCat.includes('tenis-guayos');
            }

            if (categoryParam === 'tenis-guayos') {
                return pCat === 'tenis-guayos' || pCat.includes('tenis-guayo') || pName.includes('teniguayo') || pName.includes('tenis-guayo');
            }

            if (categoryParam === 'futsal') {
                return pCat === 'futsal';
            }

            if (categoryParam && (categoryParam.includes('peto') || categoryParam.includes('camiseta'))) {
                return pCat.includes('peto') || pCat.includes('camiseta');
            }

            if (categoryParam) {
                const cats = categoryParam.toLowerCase().split(',').map(c => c.trim());
                return cats.some(c => pCat.includes(c) || pCat === c);
            }

            return false;
        });

        if (latestProduct) {
            let imgUrl = latestProduct.image;
            if (!imgUrl && Array.isArray(latestProduct.images) && latestProduct.images.length > 0) {
                imgUrl = latestProduct.images[0];
            }
            if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                img.src = imgUrl;
            }
        }
    });
}

document.addEventListener('productsLoaded', updateCategoryCardImages);
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateCategoryCardImages, 300);
});
