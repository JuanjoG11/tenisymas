const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ORDER_ID = 'e0780635-c568-440a-b6ee-166511df2bb2';

async function discountStock() {
    console.log(`🔍 Buscando pedido ${ORDER_ID}...`);
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', ORDER_ID)
        .single();

    if (orderError) {
        console.error('❌ Error buscando el pedido:', orderError.message);
        return;
    }

    if (order.stock_processed) {
        console.log('✅ El stock de este pedido ya había sido descontado anteriormente.');
        return;
    }

    console.log(`📦 Pedido encontrado. Cliente: ${order.customer_info.first_name || order.customer_info.firstName} ${order.customer_info.last_name || order.customer_info.lastName}`);
    console.log(`🛍️ Productos en el pedido:`);
    console.log(JSON.stringify(order.items, null, 2));

    for (const item of order.items) {
        const productId = item.id || item.product_id;
        const size = String(item.size);
        const qty = item.quantity || 1;

        if (!productId) {
            console.warn(`⚠️ El producto "${item.name}" no tiene ID. Saltando...`);
            continue;
        }

        console.log(`\n👟 Procesando: ${item.name} | Talla: ${size} | Cantidad a restar: ${qty}`);

        // 1. Obtener stock actual
        const { data: invData, error: fetchErr } = await supabase
            .from('inventory')
            .select('stock')
            .eq('product_id', productId)
            .eq('location_id', 0)
            .eq('size', size)
            .single();

        if (fetchErr && fetchErr.code !== 'PGRST116') {
            console.error(`❌ Error consultando inventario para producto ${productId}:`, fetchErr.message);
            continue;
        }

        const currentStock = invData ? invData.stock : 0;
        const newStock = Math.max(0, currentStock - qty);
        console.log(`   Stock actual: ${currentStock} ➡️ Nuevo stock: ${newStock}`);

        // 2. Actualizar stock
        const { error: upsertErr } = await supabase
            .from('inventory')
            .upsert({
                product_id: productId,
                location_id: 0,
                size: size,
                stock: newStock,
                updated_at: new Date().toISOString()
            }, { onConflict: 'product_id, location_id, size' });

        if (upsertErr) {
            console.error(`❌ Error actualizando inventario:`, upsertErr.message);
            continue;
        }
        console.log(`   ✅ Inventario actualizado con éxito.`);
    }

    // 3. Marcar pedido como procesado
    console.log(`\n💾 Marcando el pedido como "stock_processed = true" en la base de datos...`);
    const { error: updateError } = await supabase
        .from('orders')
        .update({ stock_processed: true })
        .eq('id', ORDER_ID);

    if (updateError) {
        console.error(`❌ Error al actualizar el estado del pedido:`, updateError.message);
        return;
    }

    console.log(`🎉 ¡Operación completada con éxito! El stock ya fue restado y el pedido marcado como procesado.`);
}

discountStock();
