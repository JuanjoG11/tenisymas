const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';

const payload = {
    orderData: {
        allySlug: "tennisymasco-ecommerce",
        orderId: "TM-TEST-" + Date.now(),
        totalAmount: 250000,
        currency: "COP",
        shippingAddress: {
            line1: "CALLE 100 # 15-20",
            city: "BOGOTA",
            administrativeDivision: "BOGOTA DC",
            country: "CO"
        },
        client: {
            idType: "CC",
            idNumber: "1234567890",
            firstName: "JUAN",
            lastName: "PEREZ",
            email: "test@example.com",
            cellphone: "3001234567"
        },
        items: [{
            sku: "REF-001",
            name: "TENIS PRUEBA",
            quantity: 1,
            unitPrice: 233500
        }]
    }
};

async function testAddi() {
    console.log("🚀 Enviando payload de prueba a la Edge Function de Addi...");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    try {
        const response = await fetch('https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/addi-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log("\n--- RESPUESTA DEL SERVIDOR ---");
        console.log("HTTP Status:", response.status);
        
        let json;
        try {
            json = JSON.parse(responseText);
            console.log("Body (JSON):", JSON.stringify(json, null, 2));
            
            if (json.redirectionUrl) {
                console.log("\n✅ ADDI FUNCIONA! URL de redirección:", json.redirectionUrl);
            } else {
                console.log("\n❌ ADDI FALLÓ.");
                if (json.details) {
                    console.log("Detalles del error Addi:", JSON.stringify(json.details, null, 2));
                }
                if (json.sent_payload) {
                    console.log("Payload enviado a Addi:", JSON.stringify(json.sent_payload, null, 2));
                }
            }
        } catch(e) {
            console.log("Body (texto):", responseText);
        }
        
    } catch (err) {
        console.error("❌ Error de red:", err.message);
    }
}

testAddi();
