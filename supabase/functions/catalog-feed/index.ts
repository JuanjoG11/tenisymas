import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parsePrice(priceString: any): number {
    if (typeof priceString === 'number') return priceString;
    if (!priceString) return 0;
    const clean = String(priceString).replace(/[^\d]/g, '');
    return parseInt(clean) || 0;
}

function getGoogleCategory(cat: string): string {
    const c = String(cat).toLowerCase();
    if (c.includes('guayo')) return 'Apparel &amp; Accessories &gt; Shoes &gt; Athletic Shoes &gt; Soccer Shoes';
    if (c.includes('futsal') || c.includes('tenis') || c.includes('calzado') || c.includes('running')) {
        return 'Apparel &amp; Accessories &gt; Shoes &gt; Athletic Shoes';
    }
    if (c.includes('uniforme') || c.includes('camiseta') || c.includes('peto') || c.includes('ropa')) {
        return 'Apparel &amp; Accessories &gt; Clothing &gt; Activewear';
    }
    return 'Apparel &amp; Accessories &gt; Shoes';
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
        const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

        if (!SUPABASE_URL || !SERVICE_ROLE) {
            throw new Error("Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        }

        // Fetch products and inventory from Supabase REST API
        const [prodRes, invRes] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
                headers: {
                    "Authorization": `Bearer ${SERVICE_ROLE}`,
                    "apikey": SERVICE_ROLE
                }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/inventory?select=product_id,stock`, {
                headers: {
                    "Authorization": `Bearer ${SERVICE_ROLE}`,
                    "apikey": SERVICE_ROLE
                }
            })
        ]);

        if (!prodRes.ok) throw new Error(`Failed to fetch products: ${prodRes.statusText}`);
        const products = await prodRes.json();
        
        let inventory: any[] = [];
        if (invRes.ok) {
            inventory = await invRes.json();
        }

        // Generate XML string
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Tenis y Mas</title>
    <link>https://tenisymas.com</link>
    <description>Catálogo de productos tenisymas.com para Meta / Facebook Ads</description>\n`;

        for (const product of products) {
            const id = product.id;
            const name = String(product.name || '').trim().toUpperCase();
            const category = product.category || 'Calzado';
            const brand = product.brand || product.marca || 'Tenis y Mas';
            
            // Clean up main image URL
            let imageLink = product.image || 'https://tenisymas.com/images/logo-tm.png';
            if (imageLink.startsWith('images/')) {
                imageLink = `https://tenisymas.com/${imageLink}`;
            }

            // Description
            const description = `Compra online ${name} en Tenis y Mas. Calzado y ropa deportiva con la mejor calidad y envíos a todo el país. Categoría: ${category}.`;

            // Link specific to this product using search parameter
            const link = `https://tenisymas.com/collections.html?search=${encodeURIComponent(name)}`;

            // Price calculations
            const price = parsePrice(product.price);
            const oldPrice = parsePrice(product.oldprice || product.oldPrice || product.old_price);
            
            let priceXml = `      <g:price>${price} COP</g:price>`;
            if (oldPrice > price) {
                priceXml = `      <g:price>${oldPrice} COP</g:price>\n      <g:sale_price>${price} COP</g:sale_price>`;
            }

            // Availability calculation
            const pInv = inventory.filter((i: any) => i.product_id === id);
            const totalStock = pInv.reduce((sum: number, item: any) => sum + (item.stock || 0), 0);
            const availability = (pInv.length === 0 || totalStock > 0) ? 'in stock' : 'out of stock';

            // Additional images (if available)
            let additionalImagesXml = '';
            let extraImages: any = product.images;
            if (extraImages) {
                if (typeof extraImages === 'string') {
                    try {
                        extraImages = JSON.parse(extraImages);
                    } catch (_) {
                        extraImages = extraImages.split(',').map((img: string) => img.trim());
                    }
                }
                if (Array.isArray(extraImages)) {
                    extraImages.forEach((img: string) => {
                        if (img && img !== product.image && img.startsWith('http')) {
                            additionalImagesXml += `      <g:additional_image_link>${img}</g:additional_image_link>\n`;
                        }
                    });
                }
            }

            const googleCategory = getGoogleCategory(category);

            xml += `    <item>
      <g:id>${id}</g:id>
      <g:title><![CDATA[${name}]]></g:title>
      <g:description><![CDATA[${description}]]></g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
${additionalImagesXml}      <g:brand><![CDATA[${brand}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
${priceXml}
      <g:google_product_category>${googleCategory}</g:google_product_category>
    </item>\n`;
        }

        xml += `  </channel>
</rss>`;

        return new Response(xml, {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/xml; charset=utf-8",
                "Cache-Control": "public, max-age=60" // Cache for 60 seconds
            },
            status: 200,
        })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
