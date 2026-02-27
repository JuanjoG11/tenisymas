const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://shbtmkeyarqppasdpzxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const defaults = [
    { name: 'Tenis Adidas Rosados', price: '$250.000', oldPrice: '$320.000' },
    { name: 'Tenis Nike Morados', price: '$220.000', oldPrice: '$280.000' },
    { name: 'Tenis Blancos/Azules', price: '$200.000', oldPrice: '$260.000' },
    { name: 'Tenis Amarillos Neón', price: '$180.000', oldPrice: '$240.000' },
    { name: 'Guayos Adidas Rosados', price: '$320.000', oldPrice: '$400.000' },
    { name: 'Guayos Adidas Blancos', price: '$350.000', oldPrice: '$450.000' },
    { name: 'Guayos Nike Negros/Dorados', price: '$300.000', oldPrice: '$380.000' },
    { name: 'Guayos Nike Aqua', price: '$340.000', oldPrice: '$420.000' },
    { name: 'Futsal Nike Blancos Multicolor', price: '$280.000', oldPrice: '$350.000' },
    { name: 'Futsal Morados Arcoíris', price: '$260.000', oldPrice: '$320.000' },
    { name: 'Futsal Nike Fucsia', price: '$270.000', oldPrice: '$340.000' },
    { name: 'Futsal Nike Total 90', price: '$290.000', oldPrice: '$380.000' },
    { name: 'Zapato Niños 1', price: '$120.000', oldPrice: '$180.000' },
    { name: 'Zapato Niños 2', price: '$130.000', oldPrice: '$190.000' },
    { name: 'Zapato Niños 3', price: '$125.000', oldPrice: '$185.000' },
    { name: 'Zapato Niños 4', price: '$115.000', oldPrice: '$175.000' },
    { name: 'Zapato Niños 5', price: '$120.000', oldPrice: '$180.000' }
];

async function restore() {
    const { data: dbProducts, error } = await supabase.from('products').select('*');
    if (error) {
        console.error(error);
        return;
    }

    for (const prod of dbProducts) {
        if (!prod.price) { // If it has no price
            // Try to find an exact match in defaults
            const match = defaults.find(d =>
                d.name.toLowerCase().trim() === prod.name.toLowerCase().trim()
            );

            if (match) {
                console.log(`Fixing exact match: ${prod.name}`);
                await supabase.from('products').update({
                    price: match.price,
                    oldprice: match.oldPrice
                }).eq('id', prod.id);
            } else {
                // Try fuzzy matching for "Niños" generic matches
                if (prod.category === 'ninos' && !prod.price) {
                    // Just set a generic price for kids to fix them
                    await supabase.from('products').update({
                        price: '$120.000',
                        oldprice: '$180.000'
                    }).eq('id', prod.id);
                    console.log(`Fixed Niños product implicitly: ${prod.name}`);
                }
            }
        }
    }
    console.log("Done restoring known defaults.");
}
restore();
