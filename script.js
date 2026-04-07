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

    // 4. Sync with Supabase (Singleton promise)
    window.productsLoaded = syncProducts();

    // 5. Reveal WhatsApp Button after Intro
    setTimeout(() => {
        const waBtn = document.querySelector('.whatsapp-float');
        if (waBtn) waBtn.classList.add('visible');
    }, 2000); // Reduced from 3500ms
});

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
    localStorage.setItem('tm_cart', JSON.stringify(cart));
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

    // Update Items List
    if (cart.length === 0) {
        if (cartItems) cartItems.innerHTML = '<div class="empty-cart-msg">Tu carrito está vacío 🛒</div>';
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.5';
        }
    } else {
        if (cartItems) {
            cartItems.innerHTML = cart.map((item, index) => `
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
    // Update Total Price (Parsing currency string like "$250.000")
    const total = cart.reduce((sum, item) => {
        // Safe price parsing
        let price = 0;
        if (typeof item.price === 'number') {
            price = item.price;
        } else if (typeof item.price === 'string' && item.price) {
            price = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        }
        return sum + (price * item.quantity);
    }, 0);

    if (cartTotalPrice) cartTotalPrice.textContent = `$${total.toLocaleString('es-CO')}`;

    // Update Shipping Goal
    updateShippingGoal(total);
}

function updateShippingGoal(total) {
    const shippingMsg = document.getElementById('shippingMsg');
    const shippingProgress = document.getElementById('shippingProgress');
    const FREE_SHIPPING_THRESHOLD = 250000;

    if (!shippingMsg || !shippingProgress) return;

    if (total === 0) {
        shippingMsg.innerHTML = `¡Estás a <strong>$250.000</strong> del <strong>ENVÍO GRATIS</strong>! 🚚`;
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
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (closeCart) closeCart.addEventListener('click', closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);
    if (checkoutBtn) {
        // Legacy button handler removed/updated
    }

    // New Integrated Checkout Elements
    const btnGoToCheckout = document.getElementById('btnGoToCheckout');
    const btnBackToCart = document.getElementById('btnBackToCart');
    const checkoutForm = document.getElementById('integratedCheckoutForm');

    if (btnGoToCheckout) {
        btnGoToCheckout.addEventListener('click', () => {
            // Redirect to the new professional checkout page
            window.location.href = 'checkout.html';
        });
    }

    if (btnBackToCart) {
        btnBackToCart.addEventListener('click', () => {
            document.getElementById('checkoutView').style.display = 'none';
            document.getElementById('cartView').style.display = 'block';

            // Show them back
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
        message += `📦 *${item.quantity}x ${item.name}* - $${itemPrice.toLocaleString('es-CO')}\n`;
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

    // Auto Play
    let timer = setInterval(rotateNext, 5000);

    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(rotateNext, 5000);
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
        const CACHE_KEY = 'productsCache_v5';
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
                    isSyncing = false;
                    return products;
                }
                // If cache is very fresh, skip network fetch entirely and resolve now
                if (cacheIsFresh) {
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
            let { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
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
                            localStorage.setItem('productsCache_v5', cacheData);
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
                console.log('✅ Script.js: Data synced', products.length);
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

// Initialize
// Handled in DOMContentLoaded to prevent double fetch

// End Script
