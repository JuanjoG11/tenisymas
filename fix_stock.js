const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixAllStock() {
    console.log("Starting stock recovery process...");

    // 1. Update Inventory Table
    console.log("Updating 'inventory' table...");
    const { data: invItems, error: invError } = await supabase
        .from('inventory')
        .select('id, stock');
    
    if (invError) {
        console.error("Error fetching inventory:", invError);
    } else {
        console.log(`Found ${invItems.length} inventory records.`);
        let invUpdated = 0;
        
        // Update in batches of 50 to avoid timeout or payload limits if necessary, 
        // but for 79 products it should be small. 
        // Actually inventory records are per size, so might be more.
        
        for (const item of invItems) {
            if (item.stock !== 1) {
                const { error: updateErr } = await supabase
                    .from('inventory')
                    .update({ stock: 1, updated_at: new Date() })
                    .eq('id', item.id);
                
                if (updateErr) {
                    console.error(`Error updating inventory ID ${item.id}:`, updateErr);
                } else {
                    invUpdated++;
                }
            }
        }
        console.log(`Updated ${invUpdated} inventory records to stock 1.`);
    }

    // 2. Update Products Table (sizes column)
    console.log("\nUpdating 'products' table (sizes column)...");
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, sizes');
    
    if (prodError) {
        console.error("Error fetching products:", prodError);
    } else {
        let prodUpdated = 0;
        for (const product of products) {
            if (!product.sizes) continue;

            try {
                let sizesObj;
                let isString = false;
                if (typeof product.sizes === 'string') {
                    sizesObj = JSON.parse(product.sizes);
                    isString = true;
                } else {
                    sizesObj = product.sizes;
                }

                // If sizes is an array (sometimes it might be just names), we might need to handle it.
                // But based on sample it's an object {size: stock}.
                let modified = false;
                if (sizesObj && typeof sizesObj === 'object' && !Array.isArray(sizesObj)) {
                    for (const size in sizesObj) {
                        if (sizesObj[size] !== 1) {
                            sizesObj[size] = 1;
                            modified = true;
                        }
                    }
                } else if (Array.isArray(sizesObj)) {
                    // If it's an array of strings, we might want to convert it to an object with stock 1
                    // or just leave it if the UI handles it. 
                    // Let's see what admin.js does: it saves 'sizes' as an array of labels.
                    // Wait, admin.js line 364: sizes: sizes (where sizes is an array of labels).
                    // BUT my inspect_schema.js showed an object: "{\"39\":1,\"40\":1,...}"
                    // This is confusing. Let's stick to what we see in the DB.
                }

                if (modified) {
                    const { error: updateErr } = await supabase
                        .from('products')
                        .update({ sizes: isString ? JSON.stringify(sizesObj) : sizesObj })
                        .eq('id', product.id);
                    
                    if (updateErr) {
                        console.error(`Error updating product ${product.id}:`, updateErr);
                    } else {
                        prodUpdated++;
                    }
                }
            } catch (e) {
                console.error(`Error parsing sizes for product ${product.id}:`, e.message);
            }
        }
        console.log(`Updated ${prodUpdated} products to have stock 1 in sizes column.`);
    }

    console.log("\nStock recovery completed.");
}

fixAllStock();
