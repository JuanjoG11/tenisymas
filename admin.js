// Supabase Configuration
const SUPABASE_URL = 'https://nrlaadaggmpjtdmtntoz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybGFhZGFnZ21wanRkbXRudG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTM0NjksImV4cCI6MjA4NTAyOTQ2OX0.B7RLhRRvuz5jAsRAHLhWIPtW3KdhEEAKzoKV3DfeoJE';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false
    }
});

// Authentication
const ADMIN_PASS = 'tym2026';
let isAuthed = false;

// State
let products = [];
let editingId = null;

// DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const adminPassword = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');

const productForm = document.getElementById('productForm');
const adminProductsGrid = document.getElementById('adminProductsGrid');
const searchInput = document.getElementById('searchProducts');
const productCountBadge = document.getElementById('productCount');
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
    setupEventListeners();
});

function checkAuth() {
    if (sessionStorage.getItem('adminAuthed') === 'true') {
        showDashboard();
    }
}

function showDashboard() {
    loginOverlay.style.display = 'none';
    adminDashboard.style.display = 'block';
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
        { name: 'Tenis Adidas Rosados', category: 'tenis-guayos', price: '$250.000', oldPrice: '$320.000', image: 'images/tenis1.png' },
        { name: 'Tenis Nike Morados', category: 'tenis-guayos', price: '$220.000', oldPrice: '$280.000', image: 'images/tenis2.png' },
        { name: 'Tenis Blancos/Azules', category: 'tenis-guayos', price: '$200.000', oldPrice: '$260.000', image: 'images/tenis3.png' },
        { name: 'Tenis Amarillos Neón', category: 'tenis-guayos', price: '$180.000', oldPrice: '$240.000', image: 'images/tenis4.png' },
        { name: 'Guayos Adidas Rosados', category: 'guayos', price: '$320.000', oldPrice: '$400.000', image: 'images/guayo1.png' },
        { name: 'Guayos Adidas Blancos', category: 'guayos', price: '$350.000', oldPrice: '$450.000', image: 'images/guayo2.png' },
        { name: 'Guayos Nike Negros/Dorados', category: 'guayos', price: '$300.000', oldPrice: '$380.000', image: 'images/guayo3.png' },
        { name: 'Guayos Nike Aqua', category: 'guayos', price: '$340.000', oldPrice: '$420.000', image: 'images/guayo4.png' },
        { name: 'Futsal Nike Blancos Multicolor', category: 'futsal', price: '$280.000', oldPrice: '$350.000', image: 'images/futsal1.png' },
        { name: 'Futsal Morados Arcoíris', category: 'futsal', price: '$260.000', oldPrice: '$320.000', image: 'images/futsal2.png' },
        { name: 'Futsal Nike Fucsia', category: 'futsal', price: '$270.000', oldPrice: '$340.000', image: 'images/futsal3.png' },
        { name: 'Futsal Nike Total 90', category: 'futsal', price: '$290.000', oldPrice: '$380.000', image: 'images/futsal4.png' },
        { name: 'Zapato Niños 1', category: 'ninos', price: '$120.000', oldPrice: '$180.000', image: 'images/ninos1.jpg' },
        { name: 'Zapato Niños 2', category: 'ninos', price: '$130.000', oldPrice: '$190.000', image: 'images/ninos2.jpg' },
        { name: 'Zapato Niños 3', category: 'ninos', price: '$125.000', oldPrice: '$185.000', image: 'images/ninos3.jpg' },
        { name: 'Zapato Niños 4', category: 'ninos', price: '$115.000', oldPrice: '$175.000', image: 'images/ninos4.jpg' },
        { name: 'Zapato Niños 5', category: 'ninos', price: '$120.000', oldPrice: '$180.000', image: 'images/ninos5.jpg' }
    ];

    const { data, error } = await supabaseClient.from('products').insert(defaults).select();
    if (!error) products = data;
}

async function saveProduct(productData) {
    try {
        if (editingId) {
            const { error } = await supabaseClient
                .from('products')
                .update(productData)
                .eq('id', editingId);
            if (error) throw error;
            showToast('Producto actualizado');
        } else {
            const { error } = await supabaseClient
                .from('products')
                .insert([productData]);
            if (error) throw error;
            showToast('Producto agregado');
        }
        await loadProducts();
        resetForm();
    } catch (err) {
        console.error('Error saving product:', err);
        showToast('Error al guardar', true);
    }
}

function setupEventListeners() {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (adminPassword.value === ADMIN_PASS) {
            sessionStorage.setItem('adminAuthed', 'true');
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
        const productData = {
            name: document.getElementById('name').value,
            category: document.getElementById('category').value,
            price: document.getElementById('price').value,
            oldPrice: document.getElementById('oldPrice').value,
            image: imageInput.value || 'images/placeholder.png',
            sizes: document.getElementById('sizes').value.split(',').map(s => s.trim()).filter(s => s !== '')
        };

        await saveProduct(productData);
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
}

function resetForm() {
    productForm.reset();
    editingId = null;
    formTitle.innerText = 'Agregar Nuevo Producto';
    submitBtn.innerText = 'Guardar Producto';
    cancelBtn.style.display = 'none';
    imagePreview.style.display = 'none';
    imagePreviewText.style.display = 'block';
}

function renderAdminProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
    );

    productCountBadge.innerText = `${filtered.length} productos`;

    adminProductsGrid.innerHTML = filtered.map(product => `
        <div class="admin-product-item">
            <img src="${product.image}" class="item-img" onerror="this.src='https://via.placeholder.com/60?text=Error'">
            <div class="item-info">
                <h4>${product.name}</h4>
                <p>${product.category} | ${product.price}</p>
                <p class="item-sizes">${product.sizes ? product.sizes.join(', ') : 'Sin tallas'}</p>
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
    document.getElementById('oldPrice').value = product.oldPrice || '';
    document.getElementById('image').value = product.image;
    document.getElementById('sizes').value = product.sizes ? product.sizes.join(', ') : '';

    imagePreview.src = product.image;
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
