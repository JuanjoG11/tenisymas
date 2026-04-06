const fs = require('fs');

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnRta2V5YXJxcHBhc2Rwenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjEzODQsImV4cCI6MjA4NzQzNzM4NH0.Z4Bqo7NHUNs736UBbSG79OEwXEPQvG9ZUrgemLEquGQ';

const payload = {
    orderData: {
        allySlug: "tennisymasco-ecommerce",
        orderId: "TM-TEST-" + Date.now(),
        totalAmount: 250000,
        currency: "COP",
        shippingAddress: {
            line1: "CALLE 100 15-20",
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
            sku: "REF001",
            name: "TENIS PRUEBA",
            quantity: 1,
            unitPrice: 233500
        }]
    }
};

async function testAddi() {
    const log = {};
    log.payloadSent = payload;
    
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

        log.httpStatus = response.status;
        const responseText = await response.text();
        log.rawBody = responseText;
        
        try {
            log.parsedBody = JSON.parse(responseText);
        } catch(e) {
            log.parseError = e.message;
        }
        
    } catch (err) {
        log.networkError = err.message;
    }
    
    // Write to file as ASCII-only JSON
    fs.writeFileSync('addi_result.json', JSON.stringify(log, null, 2), 'ascii');
    console.log('Done. Check addi_result.json');
}

testAddi();
