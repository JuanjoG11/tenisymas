
const TEST_PAYLOAD = {
    orderData: {
        allySlug: "tennisymasco-ecommerce",
        orderId: "TEST-" + Date.now(),
        totalAmount: 150000,
        currency: "COP",
        shippingAddress: {
            line1: "CALLE 123",
            city: "BOGOTA",
            administrativeDivision: "BOGOTA",
            country: "CO"
        },
        client: {
            idType: "CC",
            idNumber: "123456789",
            firstName: "TEST",
            lastName: "USER",
            email: "test@example.com",
            cellphone: "3001234567"
        },
        items: [{
            sku: "REF-001",
            name: "COMPRA TEST",
            quantity: 1,
            unitPrice: 150000
        }]
    }
};

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybGFhZGFnZ21wanRkbXRudG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTM0NjksImV4cCI6MjA4NTAyOTQ2OX0.B7RLhRRvuz5jAsRAHLhWIPtW3KdhEEAKzoKV3DfeoJE';

async function testAddi() {
    console.log("Testing Addi Checkout...");
    try {
        const response = await fetch('https://nrlaadaggmpjtdmtntoz.supabase.co/functions/v1/addi-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify(TEST_PAYLOAD)
        });

        const status = response.status;
        const result = await response.json();

        console.log(`Status: ${status}`);
        console.log("Response:", JSON.stringify(result, null, 2));

        if (result.redirectionUrl) {
            console.log("\n✅ ADDI IS ACTIVE! Redirection URL obtained.");
        } else {
            console.log("\n❌ ADDI IS NOT ACTIVE or rejected the payload.");
        }
    } catch (error) {
        console.error("Error testing Addi:", error);
    }
}

testAddi();
