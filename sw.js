// ============================================================
// TENNISYMAS — Service Worker v3.0
// Estrategia: Cache-First para assets estáticos,
//             Network-First para HTML y datos de Supabase
// ============================================================

const CACHE_NAME = 'tm-static-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/collections.html',
    '/checkout.html',
    '/style.css?v=13.0',
    '/carousel.css?v=12.0',
    '/collections-style.css?v=10.0',
    '/checkout-style.css',
    '/script.js?v=22.0',
    '/collections-logic.js?v=36.0',
    '/images/logo-tm.png',
    '/images/favicon.webp',
    '/images/store-bg-1.webp',
];

// Instalar y pre-cachear assets críticos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Limpiar caches viejas al activar
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // No interceptar: Supabase API, Addi, MercadoPago, WhatsApp, analytics
    const bypass = [
        'supabase.co',
        'addi.com',
        'mercadopago',
        'wa.me',
        'facebook',
        'googleapis.com/identitytoolkit',
        'unpkg.com',
        'cdn.jsdelivr.net'
    ];
    if (bypass.some(b => url.hostname.includes(b))) return;

    // Requests POST nunca se cachean
    if (event.request.method !== 'GET') return;

    // Estrategia según tipo de recurso
    const isHTML = event.request.headers.get('accept')?.includes('text/html');
    const isStaticAsset = /\.(css|js|webp|png|jpg|jpeg|svg|woff2|mov)(\?.*)?$/.test(url.pathname);

    if (isStaticAsset) {
        // Cache-First: sirve del caché, actualiza en background
        event.respondWith(
            caches.match(event.request).then(cached => {
                const fetchPromise = fetch(event.request).then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                }).catch(() => cached);
                return cached || fetchPromise;
            })
        );
    } else if (isHTML) {
        // Network-First para HTML: siempre intenta red, cae en caché si falla
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    }
    // Todo lo demás: browser default
});
