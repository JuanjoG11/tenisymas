// Debug helper
window.addEventListener('error', function (e) {
    console.error('CRITICAL ERROR:', e.message, 'at', e.filename, ':', e.lineno);
    if (typeof showToast === 'function') showToast('Error crítico: ' + e.message, true);
    else alert('Error en la página: ' + e.message);
});

// Supabase Configuration
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';

let supabaseClient;
try {
    if (!window.supabase) {
        throw new Error('La librería de Supabase no se cargó. Verifica tu conexión a internet o el bloqueo de rastreo del navegador.');
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: false
        }
    });
} catch (e) {
    console.error('FALLO AL INICIALIZAR SUPABASE:', e);
    alert('ERROR: ' + e.message);
}

// Authentication (Obfuscated)
const _0x1a2b = ['t', 'y', 'm', '2', '0', '2', '6'];
const ADMIN_PASS = _0x1a2b.join('');
let isAuthed = false;

// State
let products = [];
let orders = [];
let editingId = null;
let currentTab = 'products';

// DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const adminPassword = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');

// View Containers
const productsView = document.getElementById('productsView');
const ordersView = document.getElementById('ordersView');
const tabButtons = document.querySelectorAll('.tab-btn');

const productForm = document.getElementById('productForm');
const adminProductsGrid = document.getElementById('adminProductsGrid');
const searchInput = document.getElementById('searchProducts');
const productCountBadge = document.getElementById('productCount');

// Orders Elements
const ordersTableBody = document.getElementById('ordersTableBody');
const searchOrdersInput = document.getElementById('searchOrders');
const orderCountBadge = document.getElementById('orderCount');
const newOrdersBadge = document.getElementById('newOrdersBadge');
const imageInput = document.getElementById('image');
const imageFile = document.getElementById('imageFile');
const manualPathContainer = document.getElementById('manualPathContainer');
const imagePreview = document.getElementById('imagePreview').querySelector('img');
const imagePreviewText = document.getElementById('imagePreview').querySelector('p');

const logoutBtn = document.getElementById('logoutBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProducts();
    loadOrders();
    setupEventListeners();
});

function checkAuth() {
    try {
        if (sessionStorage.getItem('adminAuthed') === 'true') {
            showDashboard();
        }
    } catch (e) {
        console.warn('Storage access blocked, auth session might not persist:', e);
    }
}

function showDashboard() {
    console.log('Mostrando Dashboard...');
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    isAuthed = true;
    renderAdminProducts();
}

async function loadProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            products = data;
        } else {
            // Seed defaults if empty
            await seedInitialData();
        }
        renderAdminProducts();
    } catch (err) {
        console.error('Error loading products:', err);
        showToast('Error al conectar con la base de datos', true);
    }
}

async function seedInitialData() {
    const defaults = [
        { name: 'Tenis Adidas Rosados', category: 'tenis-guayos', price: '$250.000', oldprice: '$320.000', image: 'images/tenis1.png' },
        { name: 'Tenis Nike Morados', category: 'tenis-guayos', price: '$220.000', oldprice: '$280.000', image: 'images/tenis2.png' },
        { name: 'Tenis Blancos/Azules', category: 'tenis-guayos', price: '$200.000', oldprice: '$260.000', image: 'images/tenis3.png' },
        { name: 'Tenis Amarillos Neón', category: 'tenis-guayos', price: '$180.000', oldprice: '$240.000', image: 'images/tenis4.png' },
        { name: 'Guayos Adidas Rosados', category: 'guayos', price: '$320.000', oldprice: '$400.000', image: 'images/guayo1.png' },
        { name: 'Guayos Adidas Blancos', category: 'guayos', price: '$350.000', oldprice: '$450.000', image: 'images/guayo2.png' },
        { name: 'Guayos Nike Negros/Dorados', category: 'guayos', price: '$300.000', oldprice: '$380.000', image: 'images/guayo3.png' },
        { name: 'Guayos Nike Aqua', category: 'guayos', price: '$340.000', oldprice: '$420.000', image: 'images/guayo4.png' },
        { name: 'Futsal Nike Blancos Multicolor', category: 'futsal', price: '$280.000', oldprice: '$350.000', image: 'images/futsal1.png' },
        { name: 'Futsal Morados Arcoíris', category: 'futsal', price: '$260.000', oldprice: '$320.000', image: 'images/futsal2.png' },
        { name: 'Futsal Nike Fucsia', category: 'futsal', price: '$270.000', oldprice: '$340.000', image: 'images/futsal3.png' },
        { name: 'Futsal Nike Total 90', category: 'futsal', price: '$290.000', oldprice: '$380.000', image: 'images/futsal4.png' },
        { name: 'Zapato Niños 1', category: 'ninos', price: '$120.000', oldprice: '$180.000', image: 'images/ninos1.jpg' },
        { name: 'Zapato Niños 2', category: 'ninos', price: '$130.000', oldprice: '$190.000', image: 'images/ninos2.jpg' },
        { name: 'Zapato Niños 3', category: 'ninos', price: '$125.000', oldprice: '$185.000', image: 'images/ninos3.jpg' },
        { name: 'Zapato Niños 4', category: 'ninos', price: '$115.000', oldprice: '$175.000', image: 'images/ninos4.jpg' },
        { name: 'Zapato Niños 5', category: 'ninos', price: '$120.000', oldprice: '$180.000', image: 'images/ninos5.jpg' }
    ];

    const { data, error } = await supabaseClient.from('products').insert(defaults).select();
    if (!error) products = data;
}

// Helper: Upload image to Supabase Storage (auto-creates bucket if missing)
// Falls back to base64 if storage is unavailable
async function uploadImage(file) {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `products/${fileName}`;

    // First attempt: upload directly
    let uploadResult = await supabaseClient.storage
        .from('product-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

    // If bucket not found, try to create it first
    if (uploadResult.error && uploadResult.error.message.toLowerCase().includes('bucket')) {
        showToast('Creando almacenamiento de imágenes...', false);
        const { error: bucketError } = await supabaseClient.storage.createBucket('product-images', {
            public: true,
            fileSizeLimit: 5242880 // 5MB
        });

        if (bucketError && !bucketError.message.includes('already exists')) {
            console.warn('No se pudo crear el bucket, usando base64:', bucketError.message);
            // Fallback: return base64 string saved directly in DB
            return await fileToBase64(file);
        }

        // Retry upload after bucket creation
        uploadResult = await supabaseClient.storage
            .from('product-images')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });
    }

    if (uploadResult.error) {
        console.warn('Storage falló, usando base64:', uploadResult.error.message);
        return await fileToBase64(file);
    }

    const { data: { publicUrl } } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(filePath);

    return publicUrl;
}

// Fallback: convert file to base64 string for DB storage
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        // Resize/compress before storing as base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 600;
                let w = img.width, h = img.height;
                if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
                if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function saveProduct(productData, file) {
    try {
        let finalImageUrl = productData.image;

        // If it's a new file (not just a string URL), upload it
        if (file) {
            showToast('Subiendo imagen...', false);
            finalImageUrl = await uploadImage(file);
        }

        // Build payload and ALWAYS strip auto-managed columns to avoid
        // "duplicate key value violates unique constraint 'products_pkey'"
        const { id, created_at, ...rest } = { ...productData, image: finalImageUrl };
        const dataToSave = rest;

        if (editingId) {
            const { error } = await supabaseClient
                .from('products')
                .update(dataToSave)
                .eq('id', editingId);
            if (error) throw error;
            showToast('Producto actualizado ✓');
        } else {
            const { error } = await supabaseClient
                .from('products')
                .insert([dataToSave]);
            if (error) throw error;
            showToast('Producto agregado ✓');
        }
        await loadProducts();
        resetForm();
    } catch (err) {
        console.error('Error saving product:', err);
        showToast(err.message || 'Error al guardar', true);
    }
}

function setupEventListeners() {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (adminPassword.value === ADMIN_PASS) {
            try {
                sessionStorage.setItem('adminAuthed', 'true');
            } catch (err) {
                console.warn('No se pudo guardar la sesion en el almacenamiento:', err);
            }
            showDashboard();
        } else {
            loginError.style.display = 'block';
            setTimeout(() => { loginError.style.display = 'none'; }, 3000);
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminAuthed');
        window.location.reload();
    });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent double-submit
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;

        try {
            const file = imageFile.files[0];

            const extraImagesRaw = document.getElementById('extraImages').value;
            let extraUrls = extraImagesRaw.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));

            // Handle multi-image upload
            const galleryFilesInput = document.getElementById('galleryFiles');
            if (galleryFilesInput.files && galleryFilesInput.files.length > 0) {
                showToast(`Subiendo ${galleryFilesInput.files.length} fotos adicionales...`, false);
                for (let i = 0; i < galleryFilesInput.files.length; i++) {
                    const url = await uploadImage(galleryFilesInput.files[i]);
                    if (url) extraUrls.push(url);
                }
            }

            const productData = {
                name: document.getElementById('name').value,
                category: document.getElementById('category').value,
                price: document.getElementById('price').value,
                oldprice: document.getElementById('oldPrice').value,
                image: imageInput.value || 'images/placeholder.png',
                images: extraUrls.length > 0 ? extraUrls : null,
                sizes: document.getElementById('sizes').value.split(',').map(s => s.trim()).filter(s => s !== '')
            };

            await saveProduct(productData, file);
        } finally {
            // Always re-enable the button (resetForm also resets it, but just in case)
            submitBtn.disabled = false;
        }
    });

    cancelBtn.addEventListener('click', resetForm);

    // Image File Handler
    imageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
                imagePreviewText.style.display = 'none';
                // Also update the hidden text input for compatibility
                imageInput.value = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    imageInput.addEventListener('input', () => {
        const val = imageInput.value;
        if (val) {
            imagePreview.src = val;
            imagePreview.style.display = 'block';
            imagePreviewText.style.display = 'none';
        } else {
            imagePreview.style.display = 'none';
            imagePreviewText.style.display = 'block';
        }
    });

    // Price Formatting
    const priceFields = [document.getElementById('price'), document.getElementById('oldPrice')];
    priceFields.forEach(field => {
        field.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, ''); // Remove non-numbers
            if (val) {
                // Format with dots
                val = new Intl.NumberFormat('es-CO').format(val);
                e.target.value = `$${val}`;
            } else {
                e.target.value = '';
            }
        });
    });

    searchInput.addEventListener('input', renderAdminProducts);
    searchOrdersInput.addEventListener('input', renderOrders);

    // Live preview for new gallery uploads
    document.getElementById('galleryFiles').addEventListener('change', renderGalleryPreview);
}

function renderGalleryPreview() {
    const preview = document.getElementById('galleryPreview');
    const existingUrls = document.getElementById('extraImages').value.split('\n').filter(u => u.trim() !== '');
    
    let html = '';
    
    // Existing URLs (click X to remove)
    existingUrls.forEach((url, idx) => {
        html += `
            <div style="position:relative; width: 60px; height: 60px;">
                <img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid #444;">
                <button type="button" onclick="removeExistingImage(${idx})" style="position:absolute;top:-5px;right:-5px;background:#e74c3c;color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>
            </div>
        `;
    });
    
    // New files preview
    const files = document.getElementById('galleryFiles').files;
    Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        html += `
            <div style="position:relative; width: 60px; height: 60px; opacity: 0.8;">
                <img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;border:2px dashed #ff3333;">
            </div>
        `;
    });
    
    preview.innerHTML = html;
}

window.removeExistingImage = function(idx) {
    const existingUrls = document.getElementById('extraImages').value.split('\n').filter(u => u.trim() !== '');
    existingUrls.splice(idx, 1);
    document.getElementById('extraImages').value = existingUrls.join('\n');
    renderGalleryPreview();
};

// Tab Management
window.switchTab = (tab) => {
    currentTab = tab;

    // Update buttons
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tab));
    });

    // Update views
    if (tab === 'products') {
        productsView.style.display = 'block';
        ordersView.style.display = 'none';
        renderAdminProducts();
    } else {
        productsView.style.display = 'none';
        ordersView.style.display = 'block';
        renderOrders();
        newOrdersBadge.style.display = 'none';
    }
};

// Order Management
async function loadOrders() {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Orders table might not exist yet:', error.message);
            return;
        }

        if (data) {
            orders = data;
            renderOrders();
        }
    } catch (err) {
        console.error('Error loading orders:', err);
    }
}

function renderOrders() {
    const searchTerm = searchOrdersInput.value.toLowerCase();
    const filtered = orders.filter(o => {
        const info = o.customer_info || {};
        const firstName = (info.firstName || '').toLowerCase();
        const lastName = (info.lastName || '').toLowerCase();
        const city = (info.city || '').toLowerCase();
        const paymentMethod = (o.payment_method || '').toLowerCase();

        return firstName.includes(searchTerm) ||
            lastName.includes(searchTerm) ||
            city.includes(searchTerm) ||
            paymentMethod.includes(searchTerm);
    });

    orderCountBadge.innerText = `${filtered.length} pedidos`;

    ordersTableBody.innerHTML = filtered.map(order => {
        const date = new Date(order.created_at).toLocaleString('es-CO');
        const items = order.items.map(i => `${i.quantity}x ${i.name}`).join('<br>');
        const methodClass = `method-${order.payment_method}`;
        const statusClass = `status-${order.status || 'pending'}`;

        return `
            <tr>
                <td class="order-date">${date}</td>
                <td class="order-customer">
                    <h4>${escapeHTML(order.customer_info.firstName)} ${escapeHTML(order.customer_info.lastName)}</h4>
                    <p>${escapeHTML(order.customer_info.city)} | ${escapeHTML(order.customer_info.phone)}</p>
                </td>
                <td class="order-items-summary">${items}</td>
                <td class="order-total">
                    $${Number(order.total).toLocaleString('es-CO')}
                    ${order.status_payment ? `<br><span class="payment-status-badge status-${order.status_payment}">${order.status_payment}</span>` : ''}
                    ${order.paid_at ? `<br><small style="color: #666; font-size: 10px;">Pagado: ${new Date(order.paid_at).toLocaleDateString()}</small>` : ''}
                </td>
                <td><span class="method-badge ${methodClass}">${order.payment_method}</span></td>
                <td>
                    <select class="status-select ${statusClass}" onchange="updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Despachado</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Entregado</option>
                    </select>
                </td>
                <td>
                    <button class="btn-icon btn-view" onclick="viewOrderDetails('${order.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.updateOrderStatus = async (id, newStatus) => {
    try {
        const { error } = await supabaseClient
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;
        showToast('Estado de pedido actualizado');
        await loadOrders();
    } catch (err) {
        console.error('Error updating status:', err);
        showToast('Error al actualizar estado', true);
    }
};

window.viewOrderDetails = (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // For now simple alert with data, we could build a modal later
    const details = `
        CLIENTE: ${escapeHTML(order.customer_info.firstName)} ${escapeHTML(order.customer_info.lastName)}
        TELÉFONO: ${escapeHTML(order.customer_info.phone)}
        DIRECCIÓN: ${escapeHTML(order.customer_info.address)}
        CIUDAD: ${escapeHTML(order.customer_info.city)}, ${escapeHTML(order.customer_info.department)}
        DNI/CC: ${escapeHTML(order.customer_info.dni || 'N/A')}
        
        PAGO: ${escapeHTML(order.payment_method.toUpperCase())}
        TOTAL: $${Number(order.total).toLocaleString('es-CO')}
    `;
    alert(details);
};

function resetForm() {
    productForm.reset();
    editingId = null;
    formTitle.innerText = 'Agregar Nuevo Producto';
    submitBtn.innerText = 'Guardar Producto';
    cancelBtn.style.display = 'none';
    imagePreview.style.display = 'none';
    imagePreviewText.style.display = 'block';
    
    document.getElementById('extraImages').value = '';
    document.getElementById('galleryFiles').value = '';
    renderGalleryPreview();
}

function renderAdminProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = products.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm) ||
        (p.category || '').toLowerCase().includes(searchTerm)
    );

    productCountBadge.innerText = `${filtered.length} productos`;

    adminProductsGrid.innerHTML = filtered.map(product => `
        <div class="admin-product-item">
            <img src="${product.image}" class="item-img" onerror="this.src='https://via.placeholder.com/60?text=Error'">
            <div class="item-info">
                <h4>${escapeHTML(product.name || 'Sin Nombre')}</h4>
                <p>${escapeHTML(product.category || 'Sin Categoría')} | ${escapeHTML(product.price || 'Sin Precio')}</p>
                <p class="item-sizes">${Array.isArray(product.sizes) ? product.sizes.map(s => escapeHTML(s.toString())).join(', ') : 'Sin tallas'}</p>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-edit" onclick="editProduct(${product.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteProduct(${product.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

window.editProduct = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingId = id;
    document.getElementById('name').value = product.name;
    document.getElementById('category').value = product.category;
    document.getElementById('price').value = product.price;
    document.getElementById('oldPrice').value = product.oldprice || '';
    document.getElementById('image').value = product.image;
    let currentSizes = product.sizes || [];
    if (typeof currentSizes === 'string') {
        try { currentSizes = JSON.parse(currentSizes); } catch (e) { currentSizes = currentSizes.split(',').map(s => s.trim()); }
    }
    if (Array.isArray(currentSizes)) {
        currentSizes = currentSizes.map(s => String(s).replace(/[\[\]"]/g, '').trim()).filter(Boolean);
    }
    document.getElementById('sizes').value = currentSizes.join(', ');
    // Load extra images
    const extraImages = product.images;
    if (Array.isArray(extraImages) && extraImages.length > 0) {
        document.getElementById('extraImages').value = extraImages.join('\n');
    } else if (typeof extraImages === 'string') {
        try {
            const parsed = JSON.parse(extraImages);
            document.getElementById('extraImages').value = Array.isArray(parsed) ? parsed.join('\n') : '';
        } catch(e) {
            document.getElementById('extraImages').value = '';
        }
    } else {
        document.getElementById('extraImages').value = '';
    }
    document.getElementById('galleryFiles').value = '';
    renderGalleryPreview();

    imagePreview.style.display = 'block';
    imagePreviewText.style.display = 'none';

    formTitle.innerText = 'Editando: ' + product.name;
    submitBtn.innerText = 'Actualizar Producto';
    cancelBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        try {
            const { error } = await supabaseClient
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Producto eliminado');
            await loadProducts();
        } catch (err) {
            console.error('Error deleting:', err);
            showToast('Error al eliminar', true);
        }
    }
};

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.background = isError ? '#e74c3c' : '#27ae60';
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// Global Help Functions
window.toggleManualPath = () => {
    const container = document.getElementById('manualPathContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
};

// Help Functions
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
