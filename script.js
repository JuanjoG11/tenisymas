// Product Data
let products = [
    // Tenis-Guayos
    {
        id: 1,
        name: 'Tenis Adidas Rosados',
        category: 'tenis-guayos',
        price: '$250.000',
        oldPrice: '$320.000',
        image: 'images/tenis1.png'
    },
    {
        id: 2,
        name: 'Tenis Nike Morados',
        category: 'tenis-guayos',
        price: '$220.000',
        oldPrice: '$280.000',
        image: 'images/tenis2.png'
    },
    {
        id: 3,
        name: 'Tenis Blancos/Azules',
        category: 'tenis-guayos',
        price: '$200.000',
        oldPrice: '$260.000',
        image: 'images/tenis3.png'
    },
    {
        id: 4,
        name: 'Tenis Amarillos Neón',
        category: 'tenis-guayos',
        price: '$180.000',
        oldPrice: '$240.000',
        image: 'images/tenis4.png'
    },

    // Guayos
    {
        id: 5,
        name: 'Guayos Adidas Rosados',
        category: 'guayos',
        price: '$320.000',
        oldPrice: '$400.000',
        image: 'images/guayo1.png'
    },
    {
        id: 6,
        name: 'Guayos Adidas Blancos',
        category: 'guayos',
        price: '$350.000',
        oldPrice: '$450.000',
        image: 'images/guayo2.png'
    },
    {
        id: 7,
        name: 'Guayos Nike Negros/Dorados',
        category: 'guayos',
        price: '$300.000',
        oldPrice: '$380.000',
        image: 'images/guayo3.png'
    },
    {
        id: 8,
        name: 'Guayos Nike Aqua',
        category: 'guayos',
        price: '$340.000',
        oldPrice: '$420.000',
        image: 'images/guayo4.png'
    },

    // Fútbol Sala
    {
        id: 9,
        name: 'Futsal Nike Blancos Multicolor',
        category: 'futsal',
        price: '$280.000',
        oldPrice: '$350.000',
        image: 'images/futsal1.png'
    },
    {
        id: 10,
        name: 'Futsal Morados Arcoíris',
        category: 'futsal',
        price: '$260.000',
        oldPrice: '$320.000',
        image: 'images/futsal2.png'
    },
    {
        id: 11,
        name: 'Futsal Nike Fucsia',
        category: 'futsal',
        price: '$270.000',
        oldPrice: '$340.000',
        image: 'images/futsal3.png'
    },
    {
        id: 12,
        name: 'Futsal Nike Total 90',
        category: 'futsal',
        price: '$290.000',
        oldPrice: '$380.000',
        image: 'images/futsal4.png'
    },

    // Niños
    {
        id: 13,
        name: 'Zapato Niños 1',
        category: 'ninos',
        price: '$120.000',
        oldPrice: '$180.000',
        image: 'images/ninos1.jpg'
    },
    {
        id: 14,
        name: 'Zapato Niños 2',
        category: 'ninos',
        price: '$130.000',
        oldPrice: '$190.000',
        image: 'images/ninos2.jpg'
    },
    {
        id: 15,
        name: 'Zapato Niños 3',
        category: 'ninos',
        price: '$125.000',
        oldPrice: '$185.000',
        image: 'images/ninos3.jpg'
    },
    {
        id: 16,
        name: 'Zapato Niños 4',
        category: 'ninos',
        price: '$115.000',
        oldPrice: '$175.000',
        image: 'images/ninos4.jpg'
    },
    {
        id: 17,
        name: 'Zapato Niños 5',
        category: 'ninos',
        price: '$120.000',
        oldPrice: '$180.000',
        image: 'images/ninos5.jpg'
    }
];

// Supabase Configuration
const SUPABASE_URL = 'https://nrlaadaggmpjtdmtntoz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_G9-piiwf5z82J6WGunpV_A_t3XQ1ZF3';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false
    }
}) : null;

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial render with local data immediately
    renderProducts('tenis-guayos');
    setupFilters();
    setupMobileMenu();
    setupSmoothScroll();

    // 2. Sync with Supabase in background (no await)
    syncProducts();
});

async function syncProducts() {
    // If Supabase is blocked by browser or fails to load, use local data
    if (!supabaseClient) {
        console.warn('Supabase not available. Using local products.');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            products = data;
            // 3. Re-render only if we have new data
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.category || 'tenis-guayos';
            renderProducts(activeFilter);
        }
    } catch (err) {
        console.error('Network error or Supabase sync failed:', err);
    }
}

// WhatsApp Configuration
const WHATSAPP_NUMBER = '573204961453';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

// Render Products
function renderProducts(category) {
    if (category === 'tennis') {
        productsGrid.innerHTML = `
            <div class="variety-banner">
                <div style="font-size: 3rem; margin-bottom: 20px;">👟✨</div>
                <h3>¡MUCHA VARIEDAD PARA MOSTRAR!</h3>
                <p>
                    La línea de <strong>Tennis</strong> se renueva de forma continua para ofrecer siempre lo último del mercado.
                </p>
                <button class="btn btn-primary" onclick="window.open('https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Me gustaría ver la variedad de modelos en la línea de Tennis. ¿Podrían enviarme el catálogo actual?')}', '_blank')">
                    Ver Catálogo Completo en WhatsApp
                </button>
            </div>
        `;
    } else {
        const filteredProducts = products.filter(product => product.category === category);

        productsGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card" data-category="${product.category}">
                <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price-container">
                        ${product.oldPrice ? `<span class="product-old-price">${product.oldPrice}</span>` : ''}
                        <span class="product-price">${product.price}</span>
                    </div>
                    <button class="product-btn" onclick="buyProduct('${product.name}', '${product.price}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Comprar por WhatsApp
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Add animation to cards
    const cards = document.querySelectorAll('.product-card, .variety-banner');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Setup Category Filters
function setupFilters() {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter products
            const category = button.dataset.category;
            renderProducts(category);
        });
    });
}

// Buy Product via WhatsApp
function buyProduct(productName, productPrice) {
    const message = `¡Hola! Me interesa comprar:\n\n📦 Producto: ${productName}\n💰 Precio: ${productPrice}\n\n¿Está disponible?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}

// Mobile Menu Toggle
function setupMobileMenu() {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');

        // Animate hamburger menu
        const spans = menuToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translateY(8px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
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
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Parallax Effect on Hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-decoration');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add intersection observer for scroll animations
const observerOptions = {
    threshold: 0.05, // Lower threshold for faster reveal
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target); // Stop observing once revealed
        }
    });
}, observerOptions);

// Observe sections for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.catalog, .finance-section, .uniforms-section, .shipping-section, .contact-location');

    // Quick check for mobile: show everything immediately if small screen
    if (window.innerWidth <= 768) {
        sections.forEach(s => {
            s.style.opacity = '1';
            s.style.transform = 'none';
        });
    } else {
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(section);
        });
    }

    // Cleanup intro from DOM after animation finishes
    const intro = document.getElementById('intro');
    if (intro) {
        setTimeout(() => {
            intro.style.display = 'none';
        }, 5000); // After the 4s animation + fade
    }
});
