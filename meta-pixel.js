/**
 * META PIXEL & CONVERSIONS TRACKER — Tennis y Más
 * Manejo centralizado de eventos estándar de Meta (Facebook & Instagram Ads)
 */

// Si tienes tu ID de Pixel de Meta, cámbialo aquí.
// Ejemplo: window.META_PIXEL_ID = '123456789012345';
window.META_PIXEL_ID = window.META_PIXEL_ID || localStorage.getItem('meta_pixel_id') || 'META_PIXEL_ID_PENDIENTE';

(function() {
    const rawId = window.META_PIXEL_ID ? String(window.META_PIXEL_ID).trim() : '';
    const hasValidPixelId = rawId && rawId !== 'META_PIXEL_ID_PENDIENTE' && /^\d{8,}$/.test(rawId);

    if (!hasValidPixelId) {
        console.log('ℹ️ Meta Pixel en espera: configure META_PIXEL_ID con su ID numérico de Meta Ads.');
        return;
    }

    // 1. Inicialización base del Pixel de Meta sólo con ID real
    if (!window.fbq) {
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
    }

    fbq('init', rawId);
    fbq('track', 'PageView');
    console.log('📊 Meta Pixel inicializado con ID:', rawId);
})();

// Helpers universales para disparar eventos
window.MetaEvents = {
    // Ver un producto
    viewContent: function(product) {
        if (!product) return;
        const price = typeof product.price === 'number' ? product.price : parseInt(String(product.price).replace(/\D/g, '')) || 0;
        if (window.fbq) {
            fbq('track', 'ViewContent', {
                content_name: product.name || product.nombre || 'Calzado Deportivo',
                content_ids: [String(product.id || '')],
                content_type: 'product',
                value: price,
                currency: 'COP'
            });
        }
    },

    // Agregar al carrito
    addToCart: function(item) {
        if (!item) return;
        const price = typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/\D/g, '')) || 0;
        if (window.fbq) {
            fbq('track', 'AddToCart', {
                content_name: item.name,
                content_ids: [String(item.id || '')],
                content_type: 'product',
                value: price * (item.quantity || 1),
                currency: 'COP'
            });
        }
    },

    // Iniciar Checkout
    initiateCheckout: function(cartItems, totalValue) {
        const ids = Array.isArray(cartItems) ? cartItems.map(i => String(i.id || '')) : [];
        const numItems = Array.isArray(cartItems) ? cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0) : 1;
        if (window.fbq) {
            fbq('track', 'InitiateCheckout', {
                content_ids: ids,
                content_type: 'product',
                num_items: numItems,
                value: Number(totalValue) || 0,
                currency: 'COP'
            });
        }
    },

    // Compra completada
    purchase: function(orderId, totalValue, cartItems) {
        const ids = Array.isArray(cartItems) ? cartItems.map(i => String(i.id || '')) : [];
        const numItems = Array.isArray(cartItems) ? cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0) : 1;
        if (window.fbq) {
            fbq('track', 'Purchase', {
                content_ids: ids,
                content_type: 'product',
                num_items: numItems,
                value: Number(totalValue) || 0,
                currency: 'COP'
            });
        }
    },

    // Contacto por WhatsApp / Lead
    lead: function(label) {
        if (window.fbq) {
            fbq('track', 'Lead', {
                content_name: label || 'Contacto WhatsApp',
                currency: 'COP'
            });
        }
    }
};
