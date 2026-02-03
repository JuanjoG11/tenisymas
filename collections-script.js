// ==================== COLLECTIONS PAGE JAVASCRIPT ====================

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Collections page loaded');

    // Show skeleton loaders immediately
    showSkeletonLoaders();

    // Get category from URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        activeFilters.category = category;
        updateCategoryTitle(category);
    }

    // Update count to show loading state
    updateResultsCount(-1); // -1 = loading state

    // Load products
    await loadProducts();

    // Setup filters
    setupFilters();

    // Setup mobile filters
    setupMobileFilters();

    // Initial render and population handled inside loadProducts()

    // Hide skeleton loaders
    hideSkeletonLoaders();
});

// Update category title
function updateCategoryTitle(category) {
    const titles = {
        'guayos': { title: 'GUAYOS', subtitle: 'Domina el campo con el mejor calzado' },
        'futsal': { title: 'FÚTSAL', subtitle: 'Precisión y control en cancha' },
        'ninos': { title: 'NIÑOS', subtitle: 'Calidad para los campeones del futuro' },
        'uniformes': { title: 'UNIFORMES', subtitle: 'Viste como un profesional' },
        'tenis-guayos': { title: 'TENIS-GUAYOS', subtitle: 'Estilo y rendimiento en un solo lugar' }
    };

    const info = titles[category] || { title: 'CATÁLOGO COMPLETO', subtitle: 'Toda nuestra colección' };
    document.getElementById('categoryTitle').textContent = info.title;
    document.getElementById('categorySubtitle').textContent = info.subtitle;
}

// Load products from Supabase
// Load products from Supabase (Optimized)
async function loadProducts() {
    try {
        updateResultsCount(-1); // Show "Cargando..."

        // Wait for global sync from script.js if it's already in progress
        if (window.productsLoaded) {
            allProducts = await window.productsLoaded;
        } else if (typeof syncProducts === 'function') {
            // If script.js hasn't started yet but is available
            allProducts = await syncProducts();
        } else {
            // Fallback: Perform its own fetch if shared logic missing
            const cached = localStorage.getItem('productsCache_v2');
            if (cached) {
                allProducts = JSON.parse(cached);
                console.log('⚡ Loaded from persistent cache fallback');
            } else {
                await fetchAndCacheProducts(false);
            }
        }

        if (allProducts && allProducts.length > 0) {
            applyFilters(); // This calls renderProducts()
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showEmptyState();
    }
}

async function fetchAndCacheProducts(isBackground = false) {
    // This is now purely a fallback or background refresher
    try {
        const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
        if (!client) return;

        const { data, error } = await client
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (!error && data) {
            allProducts = data;
            try { sessionStorage.setItem('productsCache', JSON.stringify(allProducts)); } catch (e) { }

            if (!isBackground) {
                applyFilters();
                populateBrandFilters();
                populateSizeFilters();
            }
        }
    } catch (e) {
        console.error("Background fetch failed", e);
    }
}

// Populate brand filters dynamically
function populateBrandFilters() {
    const brands = [...new Set(allProducts.map(p => p.brand || p.marca).filter(Boolean))];
    const brandFiltersContainer = document.getElementById('brandFilters');

    brandFiltersContainer.innerHTML = brands.sort().map(brand => `
        <label class="filter-checkbox">
            <input type="checkbox" value="${brand}" data-filter="brand">
            <span>${brand}</span>
        </label>
    `).join('');
}

// Populate size filters dynamically
function populateSizeFilters() {
    const allSizes = new Set();
    allProducts.forEach(product => {
        const sizes = product.sizes || product.tallas || [];
        sizes.forEach(size => allSizes.add(size));
    });

    const sizesArray = Array.from(allSizes).sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        return numA - numB;
    });

    const sizeFiltersContainer = document.getElementById('sizeFilters');
    sizeFiltersContainer.innerHTML = sizesArray.map(size => `
        <label class="filter-checkbox">
            <input type="checkbox" value="${size}" data-filter="size">
            <span>${size}</span>
        </label>
    `).join('');
}

// Setup filter event listeners
function setupFilters() {
    // Brand filters
    document.querySelectorAll('[data-filter="brand"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                activeFilters.brands.push(e.target.value);
            } else {
                activeFilters.brands = activeFilters.brands.filter(b => b !== e.target.value);
            }
            applyFilters();
        });
    });

    // Price filters
    document.querySelectorAll('[data-filter="price"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                activeFilters.prices.push(e.target.value);
            } else {
                activeFilters.prices = activeFilters.prices.filter(p => p !== e.target.value);
            }
            applyFilters();
        });
    });

    // Size filters
    document.querySelectorAll('[data-filter="size"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                activeFilters.sizes.push(e.target.value);
            } else {
                activeFilters.sizes = activeFilters.sizes.filter(s => s !== e.target.value);
            }
            applyFilters();
        });
    });

    // Discount filter
    const discountFilter = document.getElementById('discountFilter');
    if (discountFilter) {
        discountFilter.addEventListener('change', (e) => {
            activeFilters.discount = e.target.checked;
            applyFilters();
        });
    }

    // Clear filters button
    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
}

// Apply all filters
function applyFilters() {
    console.log('🔍 Applying filters:', activeFilters);

    filteredProducts = allProducts.filter(product => {
        // Category filter
        // Category filter
        if (activeFilters.category) {
            // Normalize helper: lowercase and remove accents
            const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const productCategory = normalize(product.category || product.categoria || '');
            const filterCategory = normalize(activeFilters.category);

            // Special case for 'catalog' or 'all' to show everything
            if (filterCategory === 'catalogo' || filterCategory === 'all') {
                return true;
            }

            // Strict matching to prevent mixing (e.g. 'guayos' vs 'tenis-guayos')
            if (productCategory !== filterCategory) {
                return false;
            }
        }

        // Brand filter
        if (activeFilters.brands.length > 0) {
            const productBrand = product.brand || product.marca || '';
            if (!activeFilters.brands.includes(productBrand)) {
                return false;
            }
        }

        // Price filter
        if (activeFilters.prices.length > 0) {
            const price = parsePrice(product.price || product.precio);
            let matchesPrice = false;

            activeFilters.prices.forEach(range => {
                const [min, max] = range.split('-').map(Number);
                if (price >= min && price <= max) {
                    matchesPrice = true;
                }
            });

            if (!matchesPrice) return false;
        }

        // Size filter
        if (activeFilters.sizes.length > 0) {
            const productSizes = product.sizes || product.tallas || [];
            const hasMatchingSize = activeFilters.sizes.some(size => productSizes.includes(size));
            if (!hasMatchingSize) return false;
        }

        // Discount filter
        if (activeFilters.discount) {
            const hasDiscount = product.discount || product.descuento || false;
            if (!hasDiscount) return false;
        }

        return true;
    });

    renderProducts();
    updateResultsCount();
}

// Parse price string to number
function parsePrice(priceString) {
    if (typeof priceString === 'number') return priceString;
    return parseInt(priceString.replace(/[^\d]/g, '')) || 0;
}

// Render filtered products
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');

    if (filteredProducts.length === 0) {
        productsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    productsGrid.innerHTML = filteredProducts.map(product => createProductCardHTML(product)).join('');
}

// Generate HTML for a product card
function createProductCardHTML(product) {
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

// Update results count
function updateResultsCount(count = null) {
    const resultsCount = document.getElementById('resultsCount');
    if (!resultsCount) return;

    // If count is -1, show loading state
    if (count === -1) {
        resultsCount.innerHTML = '<span style="opacity: 0.7;">⏳ Cargando productos...</span>';
        return;
    }

    // Otherwise show the actual count
    const total = count !== null ? count : filteredProducts.length;
    const text = total === 1 ? 'producto' : 'productos';
    resultsCount.textContent = `${total} ${text}`;
}

// Clear all filters
function clearAllFilters() {
    activeFilters = {
        category: activeFilters.category, // Keep category
        brands: [],
        prices: [],
        sizes: [],
        discount: false
    };

    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

    applyFilters();
}

// Show empty state
function showEmptyState() {
    document.getElementById('productsGrid').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
}

// Setup mobile filters
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
            overlay.classList.remove('active');
        });
    }
}

// Show skeleton loaders
function showSkeletonLoaders() {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) {
        skeleton.classList.remove('hidden');
    }
}

// Hide skeleton loaders
function hideSkeletonLoaders() {
    const skeleton = document.getElementById('skeletonLoader');
    if (skeleton) {
        skeleton.classList.add('hidden');
    }
}

// Make clearAllFilters available globally
window.clearAllFilters = clearAllFilters;

console.log('✅ Collections script loaded');
