const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function formatProductSizes() {
    console.log("Formatting product sizes to arrays...");
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sizes');
    
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    let updatedCount = 0;
    for (const product of products) {
        let sizesArray = [];
        let modified = false;

        if (!product.sizes) {
            // If no sizes, maybe we can fetch them from inventory table?
            const { data: invData } = await supabase
                .from('inventory')
                .select('size')
                .eq('product_id', product.id);
            
            if (invData && invData.length > 0) {
                sizesArray = invData.map(i => i.size);
                modified = true;
            } else {
                continue;
            }
        } else {
            try {
                let sizesObj;
                if (typeof product.sizes === 'string') {
                    sizesObj = JSON.parse(product.sizes);
                } else {
                    sizesObj = product.sizes;
                }

                if (Array.isArray(sizesObj)) {
                    // It's already an array, but let's make sure it's clean strings
                    sizesArray = sizesObj.map(s => String(s).replace(/[\[\]"]/g, '').trim());
                    // Check if it actually changed
                    if (JSON.stringify(sizesArray) !== JSON.stringify(sizesObj)) {
                        modified = true;
                    }
                } else if (typeof sizesObj === 'object') {
                    // It's an object { "39": 1 }, convert keys to array
                    sizesArray = Object.keys(sizesObj);
                    modified = true;
                }
            } catch (e) {
                console.error(`Error parsing sizes for product ${product.id}:`, e.message);
                continue;
            }
        }

        if (modified) {
            const { error: updateError } = await supabase
                .from('products')
                .update({ sizes: sizesArray })
                .eq('id', product.id);
            
            if (updateError) {
                console.error(`Error updating product ${product.id}:`, updateError);
            } else {
                console.log(`Updated product ${product.id} (${product.name}) sizes to array.`);
                updatedCount++;
            }
        }
    }

    console.log(`\nFinished! Total products updated to array format: ${updatedCount}`);
}

formatProductSizes();
