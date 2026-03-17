// ==================== COLLECTIONS PAGE JAVASCRIPT (OPTIMIZED) ====================

// Memoization and Normalization Utilities
if (typeof normCache === 'undefined') { var normCache = new Map(); }
if (typeof normalize === 'undefined') {
    var normalize = (str) => {
        if (str === null || str === undefined) return '';
        if (typeof str !== 'string') {
            if (Array.isArray(str)) return normalize(str.join(','));
            str = String(str);
        }
        const trimmed = str.trim();
        if (!trimmed) return '';
        if (normCache.has(trimmed)) return normCache.get(trimmed);

        let result = trimmed.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[ -]/g, "");

        // Professional Mapping: 'teni guayo' -> 'tenis-guayos'
        if (result === 'teniguayo') result = 'tenisguayos';
        if (result === 'tenidiguayo') result = 'tenisguayos'; 

        normCache.set(trimmed, result);
        return result;
    };
}

// Global variables
if (typeof allProducts === 'undefined') { var allProducts = []; }
if (typeof filteredProducts === 'undefined') { var filteredProducts = []; }
if (typeof activeFilters === 'undefined') {
    var activeFilters = {
        category: null,
        brands: [],
        prices: [],
        sizes: [],
        discount: false
    };
}

// Pagination / Infinite Scroll State
if (typeof currentPage === 'undefined') { var currentPage = 1; }
if (typeof itemsPerPage === 'undefined') { var itemsPerPage = 24; }
if (typeof observer === 'undefined') { var observer = null; }
if (typeof isLoading === 'undefined') { var isLoading = false; }
if (typeof isRendering === 'undefined') { var isRendering = false; }

// Addi Configuration Fallback
window.addiAllySlug = window.addiAllySlug || "tennisymasco-ecommerce";

// Modal state
window.selectedModalSize = window.selectedModalSize || null;
window.selectedModalColor = window.selectedModalColor || null;
window.modalQty = window.modalQty || 1;
window.currentMainModalImage = window.currentMainModalImage || '';

// GLOBAL ERROR LOGGER (FOR MOBILE DEBUGGING)
window.onerror = function(msg, url, line) {
    console.error('Mobile Error:', msg, 'at', line);
    const sub = document.getElementById('categorySubtitle');
    if (sub) sub.textContent = 'Error: ' + msg.substring(0, 30);
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Collections page loaded (Logic V3)');
        setupCollections();
    } catch(err) {
        console.error('INIT FAILED:', err);
    }
});

async function setupCollections() {
    // 1. Get category immediately to ensure correct initial render
    const urlParams = new URLSearchParams(window.location.search);
    const categoryName = urlParams.get('category');
    
    if (categoryName) {
        activeFilters.category = categoryName;
    }
    
    updateCategoryTitle(categoryName);
    
    // 2. Setup Intersection Observer for infinite scroll
    try {
        if (typeof IntersectionObserver !== 'undefined') {
            setupIntersectionObserver();
        }
    } catch(e) { console.warn('Observer failed', e); }

    // 3. Load Products (Non-blocking cache-first)
    loadProducts();

    // 4. Setup Event Listeners
    setupFilters();
    setupMobileFilters();
}

// Update category title
function updateCategoryTitle(category) {
    const titles = {
        'guayos': { title: 'GUAYOS', subtitle: 'Domina el campo con el mejor calzado' },
        'futsal': { title: 'FÚTSAL', subtitle: 'Precisión y control en cancha' },
        'ninos': { title: 'NIÑOS', subtitle: 'Calidad para los campeones del futuro' },
        'uniformes': { title: 'UNIFORMES', subtitle: 'Viste como un profesional' },
        'tenis-guayos': { title: 'TENIS-GUAYOS', subtitle: 'Estilo y rendimiento en un solo lugar' },
        'petos,camisetas': { title: 'PETOS Y CAMISETAS', subtitle: 'Equípate con lo mejor para tu equipo' },
        'tenis-running': { title: 'RUNNING', subtitle: 'Máximo confort y amortiguación' },
        'tenis-futsal': { title: 'FÚTSAL', subtitle: 'Precisión y control en cancha' }
    };

    // Robust title selection: fallback to the category name itself formatted if no match
    let info = titles[category];
    if (!info && category) {
        // Format category name (e.g. tenis-guayos -> TENIS GUAYOS)
        const displayTitle = category.replace(/[-,]/g, ' ').toUpperCase();
        info = { title: displayTitle, subtitle: 'Nuestra mejor selección' };
    } else if (!info) {
        info = { title: 'CATÁLOGO COMPLETO', subtitle: 'Toda nuestra colección' };
    }

    const titleEl = document.getElementById('categoryTitle');
    const subtitleEl = document.getElementById('categorySubtitle');

    if (titleEl) titleEl.textContent = info.title;
    if (subtitleEl) subtitleEl.textContent = info.subtitle;
}

// ==================== SINGLE CLEAN PRODUCT LOADER ====================
// ONE simple path: try cache → wait for supabase → fetch → render.
// No parallel loaders. No background syncs. No race conditions.
async function loadProducts() {
    if (isLoading) return;
    isLoading = true;

    showSkeletonLoaders();
    updateResultsCount(-1);

    try {
        // STEP 1: Try to render immediately from cache
        let renderedFromCache = false;
        try {
            const cached = localStorage.getItem('productsCache_v3');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allProducts = parsed;
                    renderedFromCache = true;
                    console.log('LOAD: Cache hit -', allProducts.length, 'products');
                    ensureEssentialCollections();
                    applyFilters();
                    hideSkeletonLoaders();
                }
            }
        } catch(cacheErr) {
            try { localStorage.removeItem('productsCache_v3'); } catch(_) {}
            console.warn('LOAD: Cache invalid, cleared.');
        }

        // STEP 2: Wait for supabaseClient (scripts may load async on mobile)
        let waited = 0;
        while (waited < 4000) {
            if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) break;
            await new Promise(function(r) { setTimeout(r, 200); });
            waited += 200;
        }

        const client = (typeof supabaseClient !== 'undefined' && supabaseClient) ? supabaseClient : null;

        if (!client) {
            console.warn('LOAD: No supabase client. Using cache/virtual only.');
            if (!renderedFromCache) {
                ensureEssentialCollections();
                applyFilters();
                hideSkeletonLoaders();
            }
            isLoading = false;
            return;
        }

        // STEP 3: Fetch fresh data from Supabase
        console.log('LOAD: Fetching from Supabase...');
        const { data, error } = await client
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('LOAD: Supabase error:', error.message);
            if (!renderedFromCache) {
                ensureEssentialCollections();
                applyFilters();
                hideSkeletonLoaders();
            }
            isLoading = false;
            return;
        }

        if (!data || data.length === 0) {
            console.warn('LOAD: Supabase returned 0 products');
            if (!renderedFromCache) {
                ensureEssentialCollections();
                applyFilters();
                hideSkeletonLoaders();
            }
            isLoading = false;
            return;
        }

        // STEP 4: Render fresh data
        allProducts = data;
        console.log('LOAD: Supabase OK -', allProducts.length, 'products');
        ensureEssentialCollections();
        applyFilters();
        hideSkeletonLoaders();
        populateBrandFilters();
        populateSizeFilters();

        // STEP 5: Save to cache quietly
        try {
            localStorage.setItem('productsCache_v3', JSON.stringify(allProducts));
            localStorage.setItem('productsCache_Time', String(Date.now()));
        } catch(_) {
            try {
                const savedCart = localStorage.getItem('tm_cart');
                localStorage.clear();
                if (savedCart) localStorage.setItem('tm_cart', savedCart);
            } catch(__) {}
        }

    } catch(err) {
        console.error('LOAD: Unexpected error:', err.message || err);
        try {
            ensureEssentialCollections();
            applyFilters();
            hideSkeletonLoaders();
        } catch(_) {}
    }

    isLoading = false;
}

// Stubs kept for any legacy references (no-ops)
async function updateProductsInBackground() {}
async function fetchAndCacheProducts() {}


// Populate filters (Brand & Size)
function populateBrandFilters() {
    const brands = [...new Set(allProducts.map(p => p.brand || p.marca).filter(Boolean))];
    const container = document.getElementById('brandFilters');
    if (container) {
        container.innerHTML = brands.sort().map(brand => `
            <label class="filter-checkbox">
            <input type="checkbox" value="${brand}" data-filter="brand">
                <span>${brand}</span>
            </label>
        `).join('');
        // Re-attach listeners for new inputs
        attachFilterListeners();
    }
}

function populateSizeFilters() {
    const allSizes = new Set();
    allProducts.forEach(product => {
        let sizes = product.sizes || product.tallas || [];
        if (typeof sizes === 'string') {
            try {
                sizes = JSON.parse(sizes);
            } catch (e) {
                sizes = sizes.split(',').map(s => s.trim());
            }
        }
        if (Array.isArray(sizes)) {
            sizes.forEach(size => {
                const cleanSize = String(size).replace(/[\[\]"]/g, '').trim();
                if (cleanSize) allSizes.add(cleanSize);
            });
        }
    });

    // Feature: Clean up sizes for footwear context
    const urlParams = new URLSearchParams(window.location.search);
    let category = (urlParams.get('category') ? urlParams.get('category').toLowerCase() : '');

    // If no category in URL, try to guess from products being displayed
    if (!category && allProducts.length > 0) {
        const firstProd = allProducts[0];
        category = (firstProd.category || firstProd.categoria || '').toLowerCase();
    }

    const isClothesCategory = category.includes('petos') || category.includes('camisetas') || ['clothes', 'ropa'].includes(category);
    const isFootwearCategory = ['guayos', 'tenis-guayos', 'futsal', 'tenis', 'running', 'tenis-running', 'ninos', 'shoes', 'calzado'].includes(category);

    let sizesArray = [];

    if (isClothesCategory) {
        // ONLY show S, M, L, XL for clothes, STRICTLY removing any numbers
        sizesArray = Array.from(allSizes)
            .filter(s => ["S", "M", "L", "XL", "XXL", "XS"].includes(s.toUpperCase()))
            .sort((a, b) => {
                const order = { "XS": 0, "S": 1, "M": 2, "L": 3, "XL": 4, "XXL": 5 };
                const orderA = order[a.toUpperCase()] !== undefined ? order[a.toUpperCase()] : 99;
                const orderB = order[b.toUpperCase()] !== undefined ? order[b.toUpperCase()] : 99;
                return orderA - orderB;
            });
    } else if (isFootwearCategory) {
        // ONLY show numerical sizes for footwear
        sizesArray = Array.from(allSizes)
            .filter(s => !isNaN(parseFloat(s)))
            .sort((a, b) => parseFloat(a) - parseFloat(b));
    } else {
        // General fallback: remove numbers if clothing-like sizes dominate
        const hasLetters = Array.from(allSizes).some(s => isNaN(parseFloat(s)));
        const hasNumbers = Array.from(allSizes).some(s => !isNaN(parseFloat(s)));

        sizesArray = Array.from(allSizes).sort((a, b) => {
            const isANumber = !isNaN(parseFloat(a));
            const isBNumber = !isNaN(parseFloat(b));
            if (isANumber && isBNumber) return parseFloat(a) - parseFloat(b);
            if (isANumber) return -1;
            if (isBNumber) return 1;
            return a.localeCompare(b);
        });
    }

    const container = document.getElementById('sizeFilters');
    if (container) {
        const newHTML = sizesArray.map(size => `
            <label class="filter-checkbox">
                <input type="checkbox" value="${size}" data-filter="size" ${activeFilters.sizes.includes(size) ? 'checked' : ''}>
                <span>${size}</span>
            </label>
        `).join('');
        
        // Only update DOM if content actually changed to avoid layout thrashing
        if (container.getAttribute('data-last-html') !== newHTML) {
            container.innerHTML = newHTML;
            container.setAttribute('data-last-html', newHTML);
            attachFilterListeners();
        }
    }
}

function attachFilterListeners() {
    // 1. Remove old listeners (if they were attached directly)
    // Actually, better: Use Event Delegation.
}

function setupFilters() {
    // Use Event Delegation for better performance and to avoid listener leaks
    const sidebar = document.getElementById('filtersSidebar');
    if (sidebar) {
        sidebar.addEventListener('change', (e) => {
            const el = e.target;
            const filterType = el.getAttribute('data-filter');
            
            // Handle discount filter even if it has no data-filter
            if (el.id === 'discountFilter') {
                activeFilters.discount = el.checked;
                applyFilters(true); // User action: Scroll to top
                return;
            }

            if (!filterType) return;

            const val = String(el.value); // Always stringify
            if (filterType === 'brand') {
                el.checked ? activeFilters.brands.push(val) : activeFilters.brands = activeFilters.brands.filter(b => b !== val);
            } else if (filterType === 'size') {
                el.checked ? activeFilters.sizes.push(val) : activeFilters.sizes = activeFilters.sizes.filter(s => String(s) !== val);
            } else if (filterType === 'price') {
                el.checked ? activeFilters.prices.push(val) : activeFilters.prices = activeFilters.prices.filter(p => p !== val);
            }
            applyFilters(true); // User action: Scroll to top
        });
    }

    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);
}

// Utility definitions moved to top for safety


let applyFiltersTimeout = null;
function applyFilters(shouldScroll = false) {
    if (applyFiltersTimeout) clearTimeout(applyFiltersTimeout);
    
    applyFiltersTimeout = setTimeout(() => {
        executeApplyFilters(shouldScroll);
    }, 10); // Batch rapid changes
}

function executeApplyFilters(shouldScroll = false) {
    // 1. Reset Pagination
    currentPage = 1;

    // Pre-normalize category filter once
    const fCat = activeFilters.category ? normalize(activeFilters.category) : '';
    const isSpecialCat = fCat === 'todas-las-referencias';
    const allowedCats = fCat.split(',').map(c => c.trim()).filter(c => c);

    if (!Array.isArray(allProducts)) {
        console.warn('[FILTER] AllProducts is not an array, resetting to empty.');
        allProducts = [];
    }

    filteredProducts = allProducts.filter(product => {
        if (!product) return false;
        // Category
        if (fCat && !isSpecialCat) {
            const rawCat = product.category || product.categoria || '';
            const pCat = normalize(rawCat);
            const matches = allowedCats.some(cat => pCat === cat);

            // EMERGENCY BYPASS: If category specifies petos/camisetas and we match by text, force include
            if (!matches && (fCat.includes('peto') || fCat.includes('camiseta'))) {
                const search = ((product.name || '') + ' ' + rawCat).toLowerCase();
                if (search.includes('peto') || search.includes('camiseta')) {
                    // fallthrough to next filters
                } else {
                    return false;
                }
            } else if (!matches) {
                return false;
            }
        }

        // Brand
        if (activeFilters.brands.length > 0) {
            const pBrand = product.brand || product.marca || '';
            if (!activeFilters.brands.includes(pBrand)) return false;
        }

        // Price
        if (activeFilters.prices.length > 0) {
            const price = parsePrice(product.price || product.precio);
            let match = false;
            activeFilters.prices.forEach(range => {
                const [min, max] = range.split('-').map(Number);
                if (price >= min && price <= max) match = true;
            });
            if (!match) return false;
        }

        // Size
        if (activeFilters.sizes.length > 0) {
            const rawSizes = product.sizes || product.tallas || [];
            let pSizes = [];
            if (Array.isArray(rawSizes)) {
                pSizes = rawSizes.map(s => String(s).replace(/[\[\]"]/g, '').trim());
            } else if (typeof rawSizes === 'string') {
                pSizes = rawSizes.replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
            }
            // Strict equality check after stringification
            if (!activeFilters.sizes.some(s => pSizes.includes(String(s)))) return false;
        }

        // Discount
        if (activeFilters.discount) {
            if (!product.discount && !product.descuento) return false;
        }

        return true;
    });

    // 3. Populate Filters only on first substantial load to avoid wiping user selection during interaction?
    // Actually proper pattern is to populate based on ALL data, not filtered data, so that's fine.
    // We only populate once usually, or check if empty.
    // 3. Populate Filters
    const brandContainer = document.getElementById('brandFilters');
    if (brandContainer && brandContainer.children.length === 0) populateBrandFilters();

    // Always refresh size filters to match current category
    const sizeContainer = document.getElementById('sizeFilters');
    if (sizeContainer) populateSizeFilters();

    // 4. Render First Page
    renderProducts(true, shouldScroll);
    updateResultsCount();
}

function parsePrice(priceString) {
    if (typeof priceString === 'number') return priceString;
    if (!priceString) return 0;
    if (typeof priceString === 'string') {
        const clean = priceString.replace(/[^\d]/g, '');
        return parseInt(clean) || 0;
    }
    return 0;
}

function formatDisplayPrice(price) {
    if (!price || price === '0' || price === 0 || price === '$0' || price === '0.00') return '$0';
    if (typeof price === 'number') return '$' + price.toLocaleString('es-CO');
    // If it's a string that's just digits, add $
    if (typeof price === 'string' && /^\d+$/.test(price.replace(/[.,]/g, ''))) {
        if (!price.startsWith('$')) return '$' + price;
    }
    return price;
}

// ==================== RENDERING (CHUNKED) ====================
function renderProducts(reset = true, shouldScroll = false) {
    if (isRendering) return;
    isRendering = true;

    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    const sentinelNodes = document.querySelectorAll('.scroll-sentinel');
    // More compatible way to iterate NodeList for older mobile browsers
    for (let i = 0; i < sentinelNodes.length; i++) {
        sentinelNodes[i].remove();
    }

    if (filteredProducts.length === 0) {
        productsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        isRendering = false;
        return;
    }

    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    // If reset, clear innerHTML. Then append chunk 1.
    if (reset) {
        productsGrid.innerHTML = '';
        if (shouldScroll) window.scrollTo(0, 0);
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const chunk = filteredProducts.slice(start, end);

    // Create HTML
    const html = chunk.map(product => createProductCardHTML(product)).join('');

    // Append to Grid
    if (reset) {
        productsGrid.innerHTML = html;
    } else {
        productsGrid.insertAdjacentHTML('beforeend', html);
    }

    // Add Sentinel if there are more products to show
    if (end < filteredProducts.length) {
        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        sentinel.style.height = '10px';
        sentinel.style.width = '100%';
        productsGrid.appendChild(sentinel);

        // Observe it
        if (observer) observer.observe(sentinel);
    }
    
    isRendering = false;
}




function createProductCardHTML(product) {
    // Defensive size parsing logic for rendering
    let currentSizes = [];
    const rawSizes = product.sizes || product.tallas;
    if (rawSizes) {
        if (Array.isArray(rawSizes)) {
            // Clean up elements that might still have brackets or quotes from previous bad imports
            currentSizes = rawSizes.map(s => String(s).replace(/[\[\]"]/g, '').trim()).filter(Boolean);
        } else if (typeof rawSizes === 'string') {
            try {
                if (rawSizes.startsWith('[') && rawSizes.endsWith(']')) {
                    currentSizes = JSON.parse(rawSizes).map(s => String(s).replace(/[\[\]"]/g, '').trim()).filter(Boolean);
                } else {
                    currentSizes = rawSizes.split(',').map(s => s.trim()).filter(Boolean);
                }
            } catch (e) {
                currentSizes = rawSizes.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
            }
        }
    }

    const hasSizes = currentSizes.length > 0;
    const rawColors = product.colors || product.colores;
    const hasColors = rawColors && Array.isArray(rawColors) && rawColors.length > 0;
    const requiresSelection = hasSizes || hasColors;

    // DEBUG: Check category logic
    const category = (product.category || product.categoria || '').toLowerCase().trim();

    // PORTADA (Cover) = always product.image (uploaded/main photo)
    // GALERÍA (Gallery in modal) = product.image + extra links from product.images
    let coverImage = product.image || 'images/logo-tm.png';
    
    // Normalize Supabase URL if old bucket name is present
    if (typeof coverImage === 'string' && coverImage.includes('/public/products/')) {
        coverImage = coverImage.replace('/public/products/', '/public/product-images/');
    }
    
    let extraImages = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        extraImages = product.images;
    }
    
    // Full gallery: cover first, then extra photos (avoid duplicates)
    const images = [coverImage, ...extraImages.filter(img => img !== coverImage)];
    const hasMultipleImages = images.length > 1;
    // Optimization: Only render first 2 images for the catalog to avoid excessive memory/DOM usage
    // The modal will still show EVERYTHING including Supabase auto-discovery.
    const catalogImages = images.slice(0, 2); 
    const mainImage = coverImage;

    // Determine correct selector type (Chips vs Dropdown)
    const isFootwear = ['guayos', 'tenis-guayos', 'futsal', 'tenis', 'running', 'tenis-running', 'ninos', 'tenis-futbol', 'fútbol-sala', 'fútbol sala', 'futbol sala'].includes(category);

    return `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}">
            ${product.badge || product.etiqueta ? `<div class="product-badge">${product.badge || product.etiqueta}</div>` : ''}
            <div class="product-image-container" data-product-id="${product.id}" onclick="if(!event.target.closest('.carousel-btn') && !event.target.closest('.carousel-dot') && !event.target.closest('.action-btn')) openProductModal('${product.id}')" style="cursor: pointer;">
                <img src="${mainImage}" 
                     alt="${product.name}" 
                      class="product-image main-img ${hasMultipleImages ? '' : 'active'}" 
                      loading="${filteredProducts.indexOf(product) < 4 ? 'eager' : 'lazy'}"
                      onload="this.classList.add('loaded')"
                      decoding="async"
                      width="300" 
                      height="300"
                >
                ${catalogImages.map((img, idx) => `
                    <img ${idx === 0 ? `src="${img}"` : `src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" data-lazy="${img}"`} 
                         alt="${product.name}" 
                         class="product-image ${idx === 0 ? 'active' : ''} ${idx === 1 ? 'hover-img' : ''}" 
                         loading="${idx === 0 ? 'eager' : 'lazy'}"
                         decoding="async"
                         width="300" 
                         height="300">
                `).join('')}
                <div class="product-actions">
                    <button class="action-btn quick-view" onclick="openQuickView('${product.id}')" aria-label="Vista Rápida">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
                ${hasMultipleImages ? `
                    <button class="carousel-btn carousel-prev" onclick="changeProductImage('${product.id}', -1)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="carousel-btn carousel-next" onclick="changeProductImage('${product.id}', 1)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="carousel-dots">
                        ${catalogImages.map((_, index) => `
                            <span class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="goToProductImage('${product.id}', ${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="product-info" onclick="openProductModal('${product.id}')" style="cursor: pointer;">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price-container">
                    ${product.oldPrice || product.oldprice || product.old_price || product.precio_anterior ? `<span class="product-old-price">${formatDisplayPrice(product.oldPrice || product.oldprice || product.old_price || product.precio_anterior)}</span>` : ''}
                    <span class="product-price">${formatDisplayPrice(product.price || product.precio)}</span>
                </div>
                <!-- Addi Installments Widget -->
                <addi-widget price="${(product.price || product.precio || '0').toString().replace(/[^0-9]/g, '') || '0'}" ally-slug="tennisymasco-ecommerce"></addi-widget>

                <div class="view-details-tag">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span>Agregar al Carrito</span>
                </div>
            </div>
        </div>
    `;
}

// ==================== PROFESSIONAL MODAL LOGIC (Virtual RPM Engine) ====================
async function openProductModal(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    const modal = document.getElementById('productModal');
    if (!modal) return;

    // Reset state
    selectedModalSize = null;
    selectedModalColor = null;
    modalQty = 1;
    const qtyValueDisplay = document.getElementById('modalQtyValue');
    if (qtyValueDisplay) qtyValueDisplay.textContent = '1';

    // Reset main image immediately to avoid showing previous product
    const mainImg = document.getElementById('currentModalImg');
    if (mainImg) {
        mainImg.src = 'images/logo-tm.png';
        mainImg.alt = 'Cargando...';
    }
    currentMainModalImage = '';

    // Set textual details
    const titleEl = document.getElementById('modalTitle');
    const categoryEl = document.getElementById('modalCategory');
    const priceEl = document.getElementById('modalPrice');
    
    if (titleEl) titleEl.textContent = product.name;
    if (categoryEl) categoryEl.textContent = product.category || product.categoria || 'Calzado';
    if (priceEl) priceEl.textContent = formatDisplayPrice(product.price || product.precio);

    if (mainImg) {
        mainImg.onerror = () => {
            console.warn('[MODAL] Image failed to load, using logo as fallback');
            if (mainImg.src !== 'images/logo-tm.png') {
                mainImg.src = 'images/logo-tm.png';
            }
        };
    }
    
    const oldPrice = product.oldPrice || product.oldprice || product.old_price || product.precio_anterior;
    const oldPriceEl = document.getElementById('modalOldPrice');
    if (oldPrice && oldPriceEl) {
        oldPriceEl.textContent = formatDisplayPrice(oldPrice);
        oldPriceEl.style.display = 'block';
    } else if (oldPriceEl) {
        oldPriceEl.style.display = 'none';
    }

    // Initialize Images
    const modalThumbnails = document.getElementById('modalThumbnails');
    const modalMainImgContainer = document.getElementById('modalMainImage');
    modalThumbnails.innerHTML = '';
    
    // 1. Get initial images from product object: Portada first, then gallery
    let coverSrc = product.image || 'images/logo-tm.png';
    let extraSrcs = Array.isArray(product.images) ? product.images : [];
    
    // Normalize and Filter
    let images = [coverSrc, ...extraSrcs]
        .filter(img => img && typeof img === 'string')
        .map(img => img.includes('/public/products/') ? img.replace('/public/products/', '/public/product-images/') : img);
    
    // Dedup
    images = [...new Set(images)];

    // Set main image immediately
    if (mainImg) {
        mainImg.src = images[0];
        mainImg.alt = product.name;
        currentMainModalImage = images[0];
    }

    // 2. MAGIC: Load additional images from Supabase Storage automatically if folder exists
    if (product.folder && typeof window.getImagesFromFolder === 'function') {
        try {
            const extraImages = await window.getImagesFromFolder(product.folder);
            if (extraImages.length > 0) {
                // Filter out duplicates if any
                const existingUrls = new Set(images);
                extraImages.forEach(url => {
                    if (!existingUrls.has(url)) images.push(url);
                });
                
                // Safety guard: if modal was closed while images were fetching, stop
                if (!modal.classList.contains('active')) return;

                // Re-render thumbnails if more images were found
                renderModalThumbnails(images, product.name);
            }
        } catch (err) {
            console.warn('Background image fetch failed:', err);
        }
    }

    renderModalThumbnails(images, product.name);

    // Continue modal initialization...
    // Populate Colors (Pills)
    const colorGroup = document.getElementById('modalColorGroup');
    const colorPills = document.getElementById('modalColorPills');
    const productColors = product.colors || product.colores || [];
    
    if (colorGroup && colorPills) {
        if (productColors.length > 0) {
            colorGroup.style.display = 'block';
            colorPills.innerHTML = productColors.map(color => `
                <div class="pill" onclick="selectModalColor('${color}', this)">${color}</div>
            `).join('');
        } else {
            colorGroup.style.display = 'none';
        }
    }

    // Populate Sizes (Pills)
    const sizeGroup = document.getElementById('modalSizeGroup');
    const sizePills = document.getElementById('modalSizePills');
    
    let productSizes = [];
    const rawSizes = product.sizes || product.tallas;
    if (rawSizes) {
        if (Array.isArray(rawSizes)) {
            productSizes = rawSizes.map(s => String(s).replace(/[\[\]"]/g, '').trim()).filter(Boolean);
        } else if (typeof rawSizes === 'string') {
            try {
                productSizes = JSON.parse(rawSizes).map(s => String(s).replace(/[\[\]"]/g, '').trim()).filter(Boolean);
            } catch (e) {
                productSizes = rawSizes.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
    }

    if (sizeGroup && sizePills) {
        if (productSizes.length > 0) {
            sizeGroup.style.display = 'block';
            sizePills.innerHTML = productSizes.map(size => `
                <div class="pill" onclick="selectModalSize('${size}', this)">${size}</div>
            `).join('');
        } else {
            sizeGroup.style.display = 'none';
        }
    }

/** No-op to clean up the duplicated logic below **/

    // Setup Add to Cart Button
    const addToCartBtn = document.getElementById('modalAddToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.onclick = () => {
            if (productSizes.length > 0 && !selectedModalSize) {
                showNotification('Por favor selecciona una talla 👟', 'error');
                return;
            }
            if (productColors.length > 0 && !selectedModalColor) {
                showNotification('Por favor selecciona un color 🎨', 'error');
                return;
            }

            if (typeof addToCart === 'function') {
                addToCart(product.id, selectedModalSize, selectedModalColor, modalQty);
                showNotification('✅ ¡Producto agregado al carrito!', 'success');
                closeProductModal();
            }
        };
    }

    // Setup Buy Now Button (Pasarela)
    const buyNowBtn = document.getElementById('modalBuyNowBtn');
    if (buyNowBtn) {
        // Update text as requested
        buyNowBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            COMPRAR AHORA
        `;
        
        buyNowBtn.onclick = (e) => {
            if (e) e.preventDefault();
            
            if (productSizes.length > 0 && !selectedModalSize) {
                showNotification('⚠️ Por favor selecciona tu Talla primero', 'error');
                // Highlight size group
                const sizeGroup = document.getElementById('modalSizeGroup');
                if (sizeGroup) {
                    sizeGroup.style.background = 'rgba(255, 51, 51, 0.1)';
                    setTimeout(() => sizeGroup.style.background = '', 1000);
                }
                return;
            }
            if (productColors.length > 0 && !selectedModalColor) {
                showNotification('⚠️ Por favor selecciona un Color', 'error');
                return;
            }

            if (typeof addToCart === 'function') {
                console.log('[DEBUG] Adding to cart from modal:', product.id, selectedModalSize);
                addToCart(product.id, selectedModalSize, selectedModalColor, modalQty);
                closeProductModal();
                // Ensure cart opens
                setTimeout(() => {
                    if (typeof openCart === 'function') openCart();
                }, 100);
            }
        };
    }

    // Show Modal — iOS-safe scroll lock
    const scrollY = window.scrollY || window.pageYOffset;
    document.body.dataset.scrollY = scrollY;
    document.body.style.top = '-' + scrollY + 'px';
    document.body.classList.add('modal-open');
    modal.classList.add('active');
}

function renderModalThumbnails(images, productName) {
    const modalThumbnails = document.getElementById('modalThumbnails');
    if (!modalThumbnails) return;

    modalThumbnails.innerHTML = '';
    images.forEach((imgUrl, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${imgUrl}" alt="${productName}">`;
        thumb.onclick = () => {
            document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            const mainImg = document.getElementById('currentModalImg');
            if (mainImg) {
                mainImg.src = imgUrl;
                currentMainModalImage = imgUrl;
            }
        };
        modalThumbnails.appendChild(thumb);
    });

    // Set main image if container exists and not already set
    const mainImg = document.getElementById('currentModalImg');
    if (mainImg && images.length > 0) {
        const currentSrc = mainImg.getAttribute('src');
        // If empty, broken, placeholder, or just weird - set the first image
        if (!currentSrc || currentSrc === '' || currentSrc.includes('placeholder') || currentSrc.includes('logo-tm') || currentSrc.length < 5) {
            console.log('[DEBUG] Setting main image to:', images[0]);
            mainImg.src = images[0];
            currentMainModalImage = images[0];
            mainImg.alt = productName;
        }
    }
}

function selectModalSize(size, element) {
    selectedModalSize = size;
    element.parentElement.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    element.classList.add('active');
}

function selectModalColor(color, element) {
    selectedModalColor = color;
    element.parentElement.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    element.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
    // iOS-safe scroll unlock: restore position
    const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
}

function openSizeGuide() {
    const modal = document.getElementById('sizeGuideModal');
    if (modal) modal.classList.add('active');
    // Ensure body overflow is hidden to prevent scroll behind
    document.body.style.overflow = 'hidden';
}

function closeSizeGuide() {
    const modal = document.getElementById('sizeGuideModal');
    if (modal) modal.classList.remove('active');
    
    // Only restore body scroll if the product modal is also closed
    const productModal = document.getElementById('productModal');
    if (productModal && !productModal.classList.contains('active')) {
        document.body.style.overflow = '';
    }
}


function updateModalQty(change) {
    modalQty += change;
    if (modalQty < 1) modalQty = 1;
    const qtyDisplay = document.getElementById('modalQtyValue');
    if (qtyDisplay) qtyDisplay.textContent = modalQty;
}

window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.selectModalSize = selectModalSize;
window.selectModalColor = selectModalColor;
window.updateModalQty = updateModalQty;

// Update original functions to link to modal
function openQuickView(productId) {
    openProductModal(productId);
}

// Global touch/swipe support for modal images? 
// (Optional, can be added later)

// ==================== IMAGE CAROUSEL FUNCTIONS ====================
function changeProductImage(productId, direction) {
    const container = document.querySelector(`.product-image-container[data-product-id="${productId}"]`);
    if (!container) return;

    const images = container.querySelectorAll('.product-image');
    if (images.length === 0) return;
    const dots = container.querySelectorAll('.carousel-dot');
    
    // Find active index
    let currentIndex = -1;
    images.forEach((img, index) => {
        if (img.classList.contains('active')) currentIndex = index;
    });
    if (currentIndex === -1) currentIndex = 0; // fallback

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    // Load lazy image if needed
    const newImg = images[newIndex];
    if (newImg.getAttribute('data-lazy') && (newImg.getAttribute('src') === '' || newImg.getAttribute('src').startsWith('data:'))) {
        newImg.setAttribute('src', newImg.getAttribute('data-lazy'));
        newImg.removeAttribute('data-lazy');
    }

    images[currentIndex].classList.remove('active');
    newImg.classList.add('active');

    if (dots.length > 0) {
        if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
        if (dots[newIndex]) dots[newIndex].classList.add('active');
    }
}

function goToProductImage(productId, index) {
    const container = document.querySelector(`.product-image-container[data-product-id="${productId}"]`);
    if (!container) return;

    const images = container.querySelectorAll('.product-image');
    if (images.length === 0 || index >= images.length) return;
    const dots = container.querySelectorAll('.carousel-dot');
    
    let currentIndex = -1;
    images.forEach((img, idx) => {
        if (img.classList.contains('active')) currentIndex = idx;
    });
    if (currentIndex === -1) currentIndex = 0;

    if (currentIndex !== index) {
        // Load lazy image if needed
        const newImg = images[index];
        if (newImg.getAttribute('data-lazy') && (newImg.getAttribute('src') === '' || newImg.getAttribute('src').startsWith('data:'))) {
            newImg.setAttribute('src', newImg.getAttribute('data-lazy'));
            newImg.removeAttribute('data-lazy');
        }

        images[currentIndex].classList.remove('active');
        newImg.classList.add('active');

        if (dots.length > 0) {
            if (dots[currentIndex]) dots[currentIndex].classList.remove('active');
            if (dots[index]) dots[index].classList.add('active');
        }
    }
}

// Add touch/swipe support
document.addEventListener('DOMContentLoaded', () => {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.product-image-container')) {
            touchStartX = e.changedTouches[0].screenX;
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const container = e.target.closest('.product-image-container');
        if (container) {
            touchEndX = e.changedTouches[0].screenX;
            const productId = container.dataset.productId;

            if (touchEndX < touchStartX - 50) {
                // Swipe left - next image
                changeProductImage(productId, 1);
            }
            if (touchEndX > touchStartX + 50) {
                // Swipe right - previous image
                changeProductImage(productId, -1);
            }
        }
    }, { passive: true });
});

// ==================== SIZE & COLOR SELECTION HANDLER ====================
function handleAddToCart(productId, requiresSize, requiresColor, btnElement) {
    let selectedSize = null;
    let selectedColor = null;
    let hasError = false;

    // Get the product card context
    const sizeEl = document.getElementById(`size-${productId}`);
    const productCard = btnElement ? btnElement.closest('.product-card') : (sizeEl ? sizeEl.closest('.product-card') : null);
    
    if (!productCard) {
        console.error("No se encontró el contenedor del producto");
        return;
    }

    // Validate Size
    if (requiresSize) {
        const sizeSelector = productCard.querySelector(`[id="size-${productId}"]`) || productCard.querySelector('.size-selector') || productCard.querySelector('input[type="hidden"]');
        selectedSize = sizeSelector ? sizeSelector.value : '';

        // Helper to find the visual container (dropdown or grid)
        const sizeGrid = productCard.querySelector(`.size-chips-grid`) || productCard.querySelector(`#size-grid-${productId}`);
        const visualElement = sizeGrid || sizeSelector;

        if (!selectedSize) {
            hasError = true;
            if (visualElement) visualElement.style.border = '2px solid #ff3333';
            if (sizeGrid) visualElement.style.borderRadius = '8px'; // Add radius for grid border

            const errorMsg = document.createElement('div');
            errorMsg.textContent = 'Por favor selecciona una talla';
            errorMsg.style.cssText = 'color: #ff3333; font-size: 12px; margin-top: 5px; font-weight: bold;';
            errorMsg.className = 'selection-error-msg';

            const container = visualElement ? visualElement.parentElement : productCard.querySelector('.size-selector-container');
            const existingError = container.querySelector('.selection-error-msg');
            if (existingError) existingError.remove();

            if (container) container.appendChild(errorMsg);

            setTimeout(() => {
                if (visualElement) visualElement.style.border = '';
                errorMsg.remove();
            }, 3000);
        } else {
            if (visualElement) visualElement.style.border = '';
        }
    }

    // Validate Color
    if (requiresColor) {
        const colorSelector = productCard.querySelector(`[id="color-${productId}"]`) || productCard.querySelector('.color-selector');
        selectedColor = colorSelector ? colorSelector.value : '';

        if (!selectedColor) {
            hasError = true;
            if (colorSelector) colorSelector.style.border = '2px solid #ff3333';

            const errorMsg = document.createElement('div');
            errorMsg.textContent = 'Por favor selecciona un color';
            errorMsg.style.cssText = 'color: #ff3333; font-size: 12px; margin-top: 5px; font-weight: bold;';
            errorMsg.className = 'selection-error-msg';

            const container = colorSelector ? colorSelector.parentElement : productCard.querySelector('.color-selector-container');
            const existingError = container.querySelector('.selection-error-msg');
            if (existingError) existingError.remove();

            if (container) container.appendChild(errorMsg);

            setTimeout(() => {
                if (colorSelector) colorSelector.style.border = '';
                errorMsg.remove();
            }, 3000);
        } else {
            if (colorSelector) colorSelector.style.border = '';
        }
    }

    // If there are errors, stop here
    if (hasError) {
        return;
    }

    // Call addToCart with size and color
    if (typeof addToCart === 'function') {
        addToCart(productId, selectedSize, selectedColor);

        // Reset selectors after adding
        if (requiresSize) {
            const sizeSelector = productCard.querySelector(`[id="size-${productId}"]`) || productCard.querySelector('.size-selector') || productCard.querySelector('input[type="hidden"]');
            if (sizeSelector) sizeSelector.value = '';

            const grid = productCard.querySelector('.size-chips-grid');
            if (grid) {
                grid.querySelectorAll('.size-chip').forEach(chip => chip.classList.remove('selected'));
            }
        }
        if (requiresColor) {
            const colorSelector = productCard.querySelector(`[id="color-${productId}"]`) || productCard.querySelector('.color-selector');
            if (colorSelector) colorSelector.value = '';
        }
    }
}

// Global function (moved out of handleAddToCart)
function selectSize(productId, size, element) {
    // 1. Update hidden input
    const productCard = element.closest('.product-card');
    if (!productCard) return;

    const input = productCard.querySelector(`input[type="hidden"]`) || productCard.querySelector(`#size-${productId}`);
    if (input) input.value = size;

    // 2. Update visuals
    const grid = element.closest('.size-chips-grid');
    if (grid) {
        // Remove active class from all chips
        grid.querySelectorAll('.size-chip').forEach(chip => chip.classList.remove('selected'));
        // Add active class to clicked chip
        element.classList.add('selected');

        // Remove error border if it exists
        grid.style.border = '';
        const container = grid.parentElement;
        if (container) {
            const errorMsg = container.querySelector('.selection-error-msg');
            if (errorMsg) errorMsg.remove();
        }
    }
}

// ==================== INFINITE SCROLL ====================
function setupIntersectionObserver() {
    const options = {
        root: null,
        rootMargin: '50px', // Pre-load before user hits bottom
        threshold: 0.1
    };

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isRendering) {
                // Remove sentinel from observer to prevent double firing
                observer.unobserve(entry.target);
                entry.target.remove();

                // Load next page
                currentPage++;
                renderProducts(false, false); // Append
            }
        });
    }, options);
}

// ==================== UTILS ====================
function updateResultsCount(count = null) {
    const resultsCount = document.getElementById('resultsCount');
    if (!resultsCount) return;

    if (count === -1) {
        resultsCount.innerHTML = '<span style="opacity: 0.7;">⌛ Cargando...</span>';
        return;
    }

    const total = count !== null ? count : filteredProducts.length;
    resultsCount.textContent = `${total} ${total === 1 ? 'producto' : 'productos'}`;
}

function clearAllFilters(shouldScroll = false) {
    activeFilters = {
        category: activeFilters.category,
        brands: [],
        prices: [],
        sizes: [],
        discount: false
    };
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }
    applyFilters(shouldScroll);
}

function showEmptyState() {
    document.getElementById('productsGrid').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
}

function setupMobileFilters() {
    const mobileBtn = document.getElementById('mobileFiltersBtn');
    const sidebar = document.getElementById('filtersSidebar');
    const overlay = document.getElementById('cartOverlay');
    const closeBtn = document.getElementById('closeFilters');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scroll
        });
    }

    const closeSidebar = () => {
        sidebar.classList.remove('active');
        if (overlay && !document.getElementById('cartDrawer').classList.contains('active')) {
            overlay.classList.remove('active');
        }
        document.body.style.overflow = ''; // Restore scroll
    };

    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
}

function ensureEssentialCollections() {
    if (!Array.isArray(allProducts)) {
        allProducts = [];
    }
    // Dedup: Ensure we don't duplicate existing products if sync runs multiple times on same array
    const petosExist = allProducts.filter(p => p && normalize(p.category || p.categoria).includes('petos'));
    const camisetasExist = allProducts.filter(p => p && normalize(p.category || p.categoria).includes('camisetas'));

    // Inject missing Petos (Expected: 2 collections at $65.000)
    if (petosExist.length < 2) {
        const hasCalidosos = petosExist.some(p => p.name.includes('Calidosos'));
        const hasPesada = petosExist.some(p => p.name.includes('Pesada'));

        if (!hasCalidosos && !allProducts.some(p => p.id === 'v-petos-1')) {
            console.log('[DEBUG] Injecting virtual Petos: Los Calidosos...');
            allProducts.push({
                id: 'v-petos-1',
                name: 'Colección Los Calidosos',
                category: 'petos',
                price: '$65.000',
                image: 'images/uniformes-main.png',
                sizes: ["S", "M", "L", "XL"],
                colors: ["NEGRO", "MORADO", "ROSADO"],
                images: [
                    'images/uniformes-main.png',
                    'images/collecionpeto1.1.jpeg',
                    'images/collecionpeto1.2.jpeg'
                ]
            });
        }

        if (!hasPesada && !allProducts.some(p => p.id === 'v-petos-2')) {
            console.log('[DEBUG] Injecting virtual Petos: La Pesada...');
            allProducts.push({
                id: 'v-petos-2',
                name: 'Colección La Pesada',
                category: 'petos',
                price: '$65.000',
                image: 'images/petos2_portada.jpg.jpeg',
                sizes: ["S", "M", "L", "XL"],
                colors: ["BLANCO-AZUL", "NEGRO", "BLANCO-VERDE"],
                images: [
                    'images/petos2_portada.jpg.jpeg',
                    'images/petos2_blanco_azul_frente.jpg.jpeg',
                    'images/petos2_blanco_azul_atras.jpg.jpeg',
                    'images/petos2_negro_verde.jpg.jpeg',
                    'images/petos2_comparacion.jpg.jpeg'
                ]
            });
        }
    }

    // Inject missing Camisetas (Expected: 1 collection at $75.000)
    if (camisetasExist.length < 1) {
        const hasGrasa = camisetasExist.some(p => p.name.includes('Grasa'));

        if (!hasGrasa && !allProducts.some(p => p.id === 'v-camisetas-1')) {
            console.log('[DEBUG] Injecting virtual Camisetas: La Grasa...');
            allProducts.push({
                id: 'v-camisetas-1',
                name: 'Colección La Grasa',
                category: 'camisetas',
                price: '$75.000',
                image: 'images/camisetas_portada.jpg.jpeg',
                sizes: ["S", "M", "L", "XL"],
                colors: ["BLANCO-AZUL", "NEGRO", "BLANCO-VERDE"],
                images: [
                    'images/camisetas_portada.jpg.jpeg',
                    'images/camisetas_foto1.jpg.jpeg',
                    'images/camisetas_foto2.jpg.jpeg',
                    'images/camisetas_foto3.jpg.jpeg',
                    'images/camisetas_foto4.jpg.jpeg'
                ]
            });
        }
    }
}

function showSkeletonLoaders() {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) skeleton.classList.remove('hidden');
}

function hideSkeletonLoaders() {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) skeleton.classList.add('hidden');
}

window.clearAllFilters = clearAllFilters;

// CUSTOM NOTIFICATION SYSTEM
if (typeof showNotification === 'undefined') {
    var showNotification = (message, type = 'info') => {
        let container = document.getElementById('tm-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'tm-notification-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10001; pointer-events: none;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `tm-notification ${type}`;
        
        toast.innerHTML = '<span class="message">' + message + '</span>';
        container.appendChild(toast);

        // Slide in
        setTimeout(() => toast.classList.add('active'), 100);

        // Slide out and remove
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    };
    window.showNotification = showNotification;
}

window.openSizeGuide = openSizeGuide;
window.closeSizeGuide = closeSizeGuide;

// SPA Routing for Category Links within collections.html
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    
    // Check if link goes to collections.html with a category
    const href = link.getAttribute('href');
    if (href && href.includes('collections.html?category=')) {
        // Intercept it!
        e.preventDefault();
        
        let newCategory = '';
        try {
            const urlParams = new URLSearchParams(href.split('?')[1]);
            newCategory = urlParams.get('category') || '';
        } catch(err) { return; }
        
        // Update URL
        window.history.pushState({ category: newCategory }, '', href);
        
        // Update State
        activeFilters.category = newCategory;
        updateCategoryTitle(newCategory);
        
        // Reset subfilters if transitioning to new main category
        activeFilters.brands = [];
        activeFilters.sizes = [];
        document.querySelectorAll('input[data-filter="size"], input[data-filter="brand"]').forEach(cb => cb.checked = false);
        
        // Filter Memory Array
        applyFilters();
        
        // Close Mobile Menu if open
        const navMenu = document.getElementById('navMenu');
        const menuToggle = document.getElementById('menuToggle');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Also handle Browser Back Button
window.addEventListener('popstate', (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    activeFilters.category = urlParams.get('category');
    updateCategoryTitle(activeFilters.category);
    applyFilters();
});


console.log('✅ Collections logic V2 ready');



