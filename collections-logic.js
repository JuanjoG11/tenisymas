// ==================== COLLECTIONS PAGE JAVASCRIPT (OPTIMIZED) ====================

// Global variables
let allProducts = [];
let filteredProducts = [];
let activeFilters = {
    category: null,
    brands: [],
    prices: [],
    sizes: [],
    discount: false
};

// Pagination / Infinite Scroll State
let currentPage = 1;
const itemsPerPage = 12;
let observer = null;
let isLoading = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Collections page loaded (Logic V2)');

    // 1. Get category immediately to ensure correct initial render
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        activeFilters.category = category;
        updateCategoryTitle(category);
    }

    // 2. Setup Intersection Observer for infinite scroll
    setupIntersectionObserver();

    // 3. Load Products (Non-blocking cache-first)
    loadProducts();

    // 4. Setup Event Listeners
    setupFilters();
    setupMobileFilters();
});

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

// Load products - CACHE-FIRST for instant feedback
// Load products - ULTRA-AGGRESSIVE CACHE-FIRST for marketplace speed
async function loadProducts() {
    console.time('loadProducts');
    try {
        if (isLoading) return;
        isLoading = true;

        // 1. PHASE 1: Instant Cache Render (ZERO DELAY)
        const cached = localStorage.getItem('productsCache_v2');
        let hasRenderedFromCache = false;

        if (cached) {
            try {
                console.time('parseCache');
                allProducts = JSON.parse(cached);
                console.timeEnd('parseCache');

                console.log('⚡ Instant render from cache');

                console.time('firstRender');
                applyFilters();
                populateBrandFilters();
                populateSizeFilters();
                hideSkeletonLoaders();
                console.timeEnd('firstRender');

                hasRenderedFromCache = true;
            } catch (e) {
                console.warn('Cache corrupted');
            }
        }
        // ... (rest of function) ...

        function parsePrice(priceString) {
            if (typeof priceString === 'number') return priceString;
            if (!priceString) return 0;
            if (typeof priceString === 'string') {
                return parseInt(priceString.replace(/[^\d]/g, '')) || 0;
            }
            return 0;
        }

        // If no cache, show skeleton
        if (!hasRenderedFromCache) {
            showSkeletonLoaders();
            updateResultsCount(-1);
        }

        // 2. PHASE 2: Background Update
        // Use the global window.productsLoaded if available, otherwise fetch
        try {
            let data = null;
            if (window.productsLoaded) {
                data = await window.productsLoaded;
            } else {
                // Fallback to direct fetch if main script hasn't started sync
                const { data: directData } = await supabaseClient
                    .from('products')
                    .select('*')
                    .order('id', { ascending: true });
                data = directData;
            }

            if (data && data.length > 0) {
                // Simplified comparison: length or first/last item check
                const isDifferent = allProducts.length !== data.length ||
                    (allProducts.length > 0 && (allProducts[0].id !== data[0].id));

                if (isDifferent || !hasRenderedFromCache) {
                    allProducts = data;

                    // Cache it
                    try {
                        localStorage.setItem('productsCache_v2', JSON.stringify(data));
                        localStorage.setItem('productsCache_Time', Date.now().toString());
                    } catch (err) { }

                    applyFilters();
                    populateBrandFilters();
                    populateSizeFilters();
                }
            }
        } catch (e) {
            console.warn('Silent sync failed:', e);
            // If we have nothing at all, try one last direct fetch
            if (allProducts.length === 0) await fetchAndCacheProducts();
        } finally {
            isLoading = false;
            hideSkeletonLoaders();
        }

    } catch (error) {
        console.error('Load error:', error);
        if (allProducts.length === 0) showEmptyState();
        hideSkeletonLoaders();
        isLoading = false;
    }
}


// Background update function (non-blocking)
async function updateProductsInBackground() {
    try {
        let freshData = [];

        // Try to get data from global sync
        if (window.productsLoaded) {
            freshData = await window.productsLoaded;
        } else if (typeof syncProducts === 'function') {
            freshData = await syncProducts();
        } else {
            // Fallback: fetch directly
            await fetchAndCacheProducts(true);
            return;
        }

        // Update if we got fresh data
        if (freshData && freshData.length > 0) {
            const previousCount = allProducts.length;
            allProducts = freshData;

            // Only re-render if data actually changed
            if (allProducts.length !== previousCount) {
                console.log('🔄 Fresh data applied silently');
                applyFilters();
            }
        }
    } catch (error) {
        console.warn('Background update failed (using cached data):', error);
    }
}

// Fallback fetcher
async function fetchAndCacheProducts(isBackground = false) {
    try {
        const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
        if (!client) {
            console.error('No Supabase client available');
            return;
        }

        console.log('📡 Fetching products directly from Supabase...');
        const { data, error } = await client
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (!error && data) {
            allProducts = data;
            console.log('✅ Products fetched successfully:', data.length);

            // Cache the data (clear old cache first to prevent quota issues)
            try {
                // Remove old cache versions
                localStorage.removeItem('productsCache');
                localStorage.removeItem('productsCache_v1');

                // Save new cache
                localStorage.setItem('productsCache_v2', JSON.stringify(data));
                localStorage.setItem('productsCache_Time', Date.now().toString());
                console.log('💾 Cache saved successfully');
            } catch (e) {
                console.warn('⚠️ Could not save cache (quota exceeded):', e.message);
                // Try to clear everything except cart and retry
                try {
                    const cart = localStorage.getItem('tm_cart');
                    localStorage.clear();
                    if (cart) localStorage.setItem('tm_cart', cart);
                    localStorage.setItem('productsCache_v2', JSON.stringify(data));
                    localStorage.setItem('productsCache_Time', Date.now().toString());
                    console.log('💾 Cache saved after cleanup');
                } catch (e2) {
                    console.error('❌ Cache save failed even after cleanup');
                }
            }

            // Always render after fetch
            applyFilters();
            populateBrandFilters();
            populateSizeFilters();
            hideSkeletonLoaders();
        } else {
            console.error('Fetch error:', error);
            if (allProducts.length === 0) showEmptyState();
        }
    } catch (e) {
        console.error("Direct fetch failed:", e);
        if (allProducts.length === 0) showEmptyState();
    }
}

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
        const sizes = product.sizes || product.tallas || [];
        sizes.forEach(size => allSizes.add(size));
    });

    let sizesArray = Array.from(allSizes);

    // Feature: Clean up sizes for footwear context
    // If we have numerical sizes, let's prioritize them and hide letters like S, M, L, XL
    const numericalSizes = sizesArray.filter(s => !isNaN(parseFloat(s)));
    if (numericalSizes.length > 0) {
        // If we are in a footwear category, ONLY show numerical sizes
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const isFootwearCategory = ['guayos', 'tenis-guayos', 'futsal', 'tenis', 'running', 'tenis-running', 'ninos'].includes(category);

        if (isFootwearCategory) {
            sizesArray = numericalSizes.sort((a, b) => parseFloat(a) - parseFloat(b));
        } else {
            // General sorting: numbers first, then letters
            sizesArray.sort((a, b) => {
                const isANumber = !isNaN(parseFloat(a));
                const isBNumber = !isNaN(parseFloat(b));
                if (isANumber && isBNumber) return parseFloat(a) - parseFloat(b);
                if (isANumber) return -1;
                if (isBNumber) return 1;
                return a.localeCompare(b);
            });
        }
    } else {
        sizesArray.sort();
    }

    const container = document.getElementById('sizeFilters');
    if (container) {
        container.innerHTML = sizesArray.map(size => `
            <label class="filter-checkbox">
                <input type="checkbox" value="${size}" data-filter="size">
                <span>${size}</span>
            </label>
        `).join('');
        attachFilterListeners(); // Re-attach
    }
}

function attachFilterListeners() {
    // Helper to re-attach listeners after dynamic population
    document.querySelectorAll('[data-filter="brand"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            e.target.checked ? activeFilters.brands.push(e.target.value) : activeFilters.brands = activeFilters.brands.filter(b => b !== e.target.value);
            applyFilters();
        });
    });
    document.querySelectorAll('[data-filter="size"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            e.target.checked ? activeFilters.sizes.push(e.target.value) : activeFilters.sizes = activeFilters.sizes.filter(s => s !== e.target.value);
            applyFilters();
        });
    });
}

function setupFilters() {
    // Only static filters like Price need setup here, dynamic ones handled in populate*
    document.querySelectorAll('[data-filter="price"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            e.target.checked ? activeFilters.prices.push(e.target.value) : activeFilters.prices = activeFilters.prices.filter(p => p !== e.target.value);
            applyFilters();
        });
    });

    const discountFilter = document.getElementById('discountFilter');
    if (discountFilter) {
        discountFilter.addEventListener('change', (e) => {
            activeFilters.discount = e.target.checked;
            applyFilters();
        });
    }

    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);
}

// ==================== CORE FILTER LOGIC ====================
// Memoization for performance
const normCache = new Map();
const normalize = (str) => {
    if (!str) return '';
    if (normCache.has(str)) return normCache.get(str);
    const result = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    normCache.set(str, result);
    return result;
};

function applyFilters() {
    // 1. Reset Pagination
    currentPage = 1;

    // Pre-normalize category filter once
    const fCat = activeFilters.category ? normalize(activeFilters.category) : null;
    const isSpecialCat = !fCat || fCat === 'catalogo' || fCat === 'all';
    const allowedCats = fCat ? fCat.split(',').map(normalize) : [];

    // 2. Filter Data
    filteredProducts = allProducts.filter(product => {
        // Category
        if (fCat && !isSpecialCat) {
            const pCat = normalize(product.category || product.categoria || '');
            if (!allowedCats.some(cat => pCat.includes(cat))) return false;
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
            const pSizes = product.sizes || product.tallas || [];
            if (!activeFilters.sizes.some(s => pSizes.includes(s))) return false;
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
    const brandContainer = document.getElementById('brandFilters');
    if (brandContainer && brandContainer.children.length === 0) populateBrandFilters();
    const sizeContainer = document.getElementById('sizeFilters');
    if (sizeContainer && sizeContainer.children.length === 0) populateSizeFilters();

    // 4. Render First Page
    renderProducts(true);
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

// ==================== RENDERING (CHUNKED) ====================
function renderProducts(reset = true) {
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    const sentinels = document.querySelectorAll('.scroll-sentinel');
    sentinels.forEach(s => s.remove()); // Remove old sentinels

    if (filteredProducts.length === 0) {
        productsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Calculate Slice
    // If reset, we start from 0 to itemsPerPage
    // If appending, we just add the ONE next chunk

    // Actually, simpler logic:
    // If reset, clear innerHTML. Then append chunk 1.
    if (reset) {
        productsGrid.innerHTML = '';
        window.scrollTo(0, 0);
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
}




function createProductCardHTML(product) {
    const hasSizes = product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0;
    const hasColors = product.colors && Array.isArray(product.colors) && product.colors.length > 0;
    const requiresSelection = hasSizes || hasColors;

    // DEBUG: Check category logic
    const category = (product.category || product.categoria || '').toLowerCase().trim();

    // Check if product has multiple images
    const images = product.images && Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.image]; // Fallback to single image

    const hasMultipleImages = images.length > 1;
    const mainImage = images[0];

    // Determine correct selector type (Chips vs Dropdown)
    const isFootwear = ['guayos', 'tenis-guayos', 'futsal', 'tenis', 'running', 'tenis-running', 'ninos', 'tenis-futbol', 'fútbol-sala', 'fútbol sala', 'futbol sala'].includes(category);

    return `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}">
            ${product.badge || product.etiqueta ? `<div class="product-badge">${product.badge || product.etiqueta}</div>` : ''}
            <div class="product-image-container" data-product-id="${product.id}">
                <img src="${mainImage}" 
                     alt="${product.name}" 
                     class="product-image main-img ${hasMultipleImages ? '' : 'active'}" 
                     loading="lazy"
                     onload="this.classList.add('loaded')"
                     decoding="async"
                     width="300" 
                     height="300"
                >
                ${images.length > 1 ? `<img src="${images[1]}" class="product-image hover-img" loading="lazy" decoding="async" width="300" height="300">` : ''}
                <div class="product-actions">
                    <button class="action-btn quick-view" onclick="openQuickView(${product.id})" aria-label="Vista Rápida">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
                ${hasMultipleImages ? `
                    <button class="carousel-btn carousel-prev" onclick="changeProductImage(${product.id}, -1)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="carousel-btn carousel-next" onclick="changeProductImage(${product.id}, 1)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="carousel-dots">
                        ${images.map((_, index) => `
                            <span class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="goToProductImage(${product.id}, ${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price-container">
                    ${product.oldPrice || product.old_price ? `<span class="product-old-price">${product.oldPrice || product.old_price}</span>` : ''}
                    <span class="product-price">${product.price}</span>
                </div>
                ${hasSizes ? `
                    <div class="size-selector-container">
                        <label for="size-${product.id}" class="size-label">Talla:</label>
                        ${isFootwear
                ? `
                            <!-- Custom Chip Selector for Footwear -->
                            <input type="hidden" id="size-${product.id}" value="">
                            <div class="size-chips-grid" id="size-grid-${product.id}">
                                ${product.sizes.map(size => `
                                    <div class="size-chip" onclick="selectSize(${product.id}, '${size}', this)">${size}</div>
                                `).join('')}
                            </div>
                            `
                : `
                            <!-- Standard Dropdown for other categories (Camisetas, Petos, etc) -->
                            <select id="size-${product.id}" class="size-selector">
                                <option value="">Selecciona una talla</option>
                                ${product.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                            </select>
                            `
            }
                    </div>
                ` : ''}
                ${hasColors ? `
                    <div class="color-selector-container">
                        <label for="color-${product.id}" class="color-label">Color:</label>
                        <select id="color-${product.id}" class="color-selector">
                            <option value="">Selecciona un color</option>
                            ${product.colors.map(color => `<option value="${color}">${color}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                <button class="product-btn" onclick="handleAddToCart(${product.id}, ${hasSizes}, ${hasColors})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <span>Agregar al Carrito</span>
                </button>
            </div>
        </div>
    `;
}

// ==================== IMAGE CAROUSEL FUNCTIONS ====================
function changeProductImage(productId, direction) {
    const container = document.querySelector(`.product-image-container[data-product-id="${productId}"]`);
    if (!container) return;

    const images = container.querySelectorAll('.product-image');
    const dots = container.querySelectorAll('.carousel-dot');
    const currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    images[currentIndex].classList.remove('active');
    images[newIndex].classList.add('active');

    if (dots.length > 0) {
        dots[currentIndex].classList.remove('active');
        dots[newIndex].classList.add('active');
    }
}

function goToProductImage(productId, index) {
    const container = document.querySelector(`.product-image-container[data-product-id="${productId}"]`);
    if (!container) return;

    const images = container.querySelectorAll('.product-image');
    const dots = container.querySelectorAll('.carousel-dot');
    const currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));

    if (currentIndex !== index) {
        images[currentIndex].classList.remove('active');
        images[index].classList.add('active');

        if (dots.length > 0) {
            dots[currentIndex].classList.remove('active');
            dots[index].classList.add('active');
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
            const productId = parseInt(container.dataset.productId);

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
function handleAddToCart(productId, requiresSize, requiresColor) {
    let selectedSize = null;
    let selectedColor = null;
    let hasError = false;

    // Validate Size
    if (requiresSize) {
        const sizeSelector = document.getElementById(`size-${productId}`);
        selectedSize = sizeSelector ? sizeSelector.value : '';

        // Helper to find the visual container (dropdown or grid)
        const sizeGrid = document.getElementById(`size-grid-${productId}`);
        const visualElement = sizeGrid || sizeSelector;

        if (!selectedSize) {
            hasError = true;
            visualElement.style.border = '2px solid #ff3333';
            if (sizeGrid) visualElement.style.borderRadius = '8px'; // Add radius for grid border

            const errorMsg = document.createElement('div');
            errorMsg.textContent = 'Por favor selecciona una talla';
            errorMsg.style.cssText = 'color: #ff3333; font-size: 12px; margin-top: 5px; font-weight: bold;';
            errorMsg.className = 'selection-error-msg';

            const existingError = sizeSelector.parentElement.querySelector('.selection-error-msg');
            if (existingError) existingError.remove();

            sizeSelector.parentElement.appendChild(errorMsg);

            setTimeout(() => {
                visualElement.style.border = '';
                errorMsg.remove();
            }, 3000);
        } else {
            visualElement.style.border = '';
        }
    }

    // Validate Color
    if (requiresColor) {
        const colorSelector = document.getElementById(`color-${productId}`);
        selectedColor = colorSelector ? colorSelector.value : '';

        if (!selectedColor) {
            hasError = true;
            colorSelector.style.border = '2px solid #ff3333';

            const errorMsg = document.createElement('div');
            errorMsg.textContent = 'Por favor selecciona un color';
            errorMsg.style.cssText = 'color: #ff3333; font-size: 12px; margin-top: 5px; font-weight: bold;';
            errorMsg.className = 'selection-error-msg';

            const existingError = colorSelector.parentElement.querySelector('.selection-error-msg');
            if (existingError) existingError.remove();

            colorSelector.parentElement.appendChild(errorMsg);

            setTimeout(() => {
                colorSelector.style.border = '';
                errorMsg.remove();
            }, 3000);
        } else {
            colorSelector.style.border = '';
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
            const sizeSelector = document.getElementById(`size-${productId}`);
            if (sizeSelector) sizeSelector.value = '';
        }
        if (requiresColor) {
            const colorSelector = document.getElementById(`color-${productId}`);
            if (colorSelector) colorSelector.value = '';
        }
    }
}

// Global function (moved out of handleAddToCart)
function selectSize(productId, size, element) {
    // 1. Update hidden input
    const input = document.getElementById(`size-${productId}`);
    if (input) input.value = size;

    // 2. Update visuals
    const grid = document.getElementById(`size-grid-${productId}`);
    if (grid) {
        // Remove active class from all chips
        grid.querySelectorAll('.size-chip').forEach(chip => chip.classList.remove('selected'));
        // Add active class to clicked chip
        element.classList.add('selected');

        // Remove error border if it exists
        grid.style.border = '';
        const errorMsg = grid.parentElement.querySelector('.selection-error-msg');
        if (errorMsg) errorMsg.remove();
    }
}

// ==================== INFINITE SCROLL ====================
function setupIntersectionObserver() {
    const options = {
        root: null,
        rootMargin: '200px', // Pre-load before user hits bottom
        threshold: 0.1
    };

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove sentinel from observer to prevent double firing
                observer.unobserve(entry.target);
                entry.target.remove();

                // Load next page
                currentPage++;
                renderProducts(false); // Append
            }
        });
    }, options);
}

// ==================== UTILS ====================
function updateResultsCount(count = null) {
    const resultsCount = document.getElementById('resultsCount');
    if (!resultsCount) return;

    if (count === -1) {
        resultsCount.innerHTML = '<span style="opacity: 0.7;">⏳ Cargando...</span>';
        return;
    }

    const total = count !== null ? count : filteredProducts.length;
    resultsCount.textContent = `${total} ${total === 1 ? 'producto' : 'productos'}`;
}

function clearAllFilters() {
    activeFilters = {
        category: activeFilters.category,
        brands: [],
        prices: [],
        sizes: [],
        discount: false
    };
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    applyFilters();
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

function showSkeletonLoaders() {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) skeleton.classList.remove('hidden');
}

function hideSkeletonLoaders() {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) skeleton.classList.add('hidden');
}

window.clearAllFilters = clearAllFilters;

console.log('✅ Collections logic V2 ready');
