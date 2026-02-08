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
    console.log('🚀 Collections page loaded (Optimized)');

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
        'petos,camisetas': { title: 'PETOS Y CAMISETAS', subtitle: 'Equípate con lo mejor para tu equipo' }
    };

    const info = titles[category] || { title: 'CATÁLOGO COMPLETO', subtitle: 'Toda nuestra colección' };
    const titleEl = document.getElementById('categoryTitle');
    const subtitleEl = document.getElementById('categorySubtitle');

    if (titleEl) titleEl.textContent = info.title;
    if (subtitleEl) subtitleEl.textContent = info.subtitle;
}

// Load products - CACHE-FIRST for instant feedback
async function loadProducts() {
    try {
        // Show skeleton immediately
        showSkeletonLoaders();
        updateResultsCount(-1);

        if (isLoading) return;
        isLoading = true;

        // 1. PHASE 1: Try to render from cache IMMEDIATELY (Instant UI)
        const cached = localStorage.getItem('productsCache_v2');
        if (cached) {
            try {
                allProducts = JSON.parse(cached);
                console.log('⚡ Rendered from cache (instant)');
                applyFilters();
                populateBrandFilters();
                populateSizeFilters();
                hideSkeletonLoaders();
                // We keep isLoading = true to allow background sync to report status
            } catch (e) {
                console.warn('Cache error, will wait for sync');
            }
        }

        // 2. PHASE 2: Wait for fresh data from the global promise (Background Sync)
        if (window.productsLoaded) {
            console.log('⏳ Syncing fresh data in background...');
            try {
                // Wait for the promise that script.js started
                const freshData = await window.productsLoaded;

                if (freshData && freshData.length > 0) {
                    const previousCount = allProducts.length;
                    allProducts = freshData;

                    // 3. Only re-apply and hide skeleton if:
                    // - We hadn't rendered anything yet
                    // - OR the data actually changed
                    if (previousCount === 0 || freshData.length !== previousCount) {
                        console.log('🔄 Fresh data applied from sync');
                        applyFilters();
                        populateBrandFilters();
                        populateSizeFilters();
                    }
                }
            } catch (syncErr) {
                console.warn('Background sync failed, using cached data:', syncErr);
            }
        }

        // Final safety check: if still no products, try direct fetch
        if (allProducts.length === 0) {
            console.log('📡 Fetch fallback (no cache or sync data)');
            const client = typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabase?.createClient(
                'https://nrlaadaggmpjtdmtntoz.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybGFhZGFnZ21wanRkbXRudG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTM0NjksImV4cCI6MjA4NTAyOTQ2OX0.B7RLhRRvuz5jAsRAHLhWIPtW3KdhEEAKzoKV3DfeoJE'
            );

            if (client) {
                const { data, error } = await client.from('products').select('*').order('id', { ascending: true });
                if (data && data.length > 0) {
                    allProducts = data;
                    applyFilters();
                }
            }
        }

        isLoading = false;
        hideSkeletonLoaders(); // Be sure they are hidden eventually

    } catch (error) {
        console.error('Load error:', error);
        showEmptyState();
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

    const sizesArray = Array.from(allSizes).sort((a, b) => parseFloat(a) - parseFloat(b));
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
const normalize = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';

function applyFilters() {
    // 1. Reset Pagination
    currentPage = 1;

    // Pre-normalize category filter once
    const fCat = activeFilters.category ? normalize(activeFilters.category) : null;
    const isSpecialCat = !fCat || fCat === 'catalogo' || fCat === 'all';

    // 2. Filter Data
    filteredProducts = allProducts.filter(product => {
        // Category
        if (fCat && !isSpecialCat) {
            const pCat = normalize(product.category || product.categoria || '');
            const allowedCats = fCat.split(',').map(normalize);
            if (!allowedCats.includes(pCat)) return false;
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
    return parseInt(priceString.replace(/[^\d]/g, '')) || 0;
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
    // Added 'contain-content' CSS class optimization if we had css for it, but standard HTML for now
    return `
        <div class="product-card" data-category="${product.category || ''}">
            <img src="${product.image}" 
                 alt="${product.name}" 
                 class="product-image" 
                 loading="lazy" 
                 decoding="async"
                 width="300" 
                 height="300">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price-container">
                    ${product.oldPrice || product.old_price ? `<span class="product-old-price">${product.oldPrice || product.old_price}</span>` : ''}
                    <span class="product-price">${product.price}</span>
                </div>
                <button class="product-btn" onclick="addToCart(${product.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <span>Agregar al Carrito</span>
                </button>
            </div>
        </div>
    `;
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

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            // Check if cart is open before removing overlay purely? 
            // Better to assume overlay handles both or use separate logic. 
            // For now, simple toggle.
            if (!document.getElementById('cartDrawer').classList.contains('active')) {
                overlay.classList.remove('active');
            }
        });
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

console.log('✅ Collections script optimized and ready');
