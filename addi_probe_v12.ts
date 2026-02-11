
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";
const ALLY_SLUG = "tennisymasco-ecommerce";

async function testTargeted(name, payload) {
    console.log(`\n--- Testing: ${name} ---`);

    // Auth
    const authRes = await fetch("https://auth.addi.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: ADDI_CLIENT_ID,
            client_secret: ADDI_CLIENT_SECRET,
            audience: "https://api.addi.com",
            grant_type: "client_credentials",
        }),
    });
    const { access_token } = await authRes.json();

    const res = await fetch("https://api.addi.com/v1/online-applications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
            "X-Ally-Slug": ALLY_SLUG
        },
        body: JSON.stringify(payload)
    });

    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
}

async function run() {
    const payload = {
        allySlug: ALLY_SLUG,
        totalAmount: 150000,
        currency: "COP",
        orderId: String(Date.now()), // Numeric orderId
        redirectionUrls: {
            success: "https://tenisymas.com/success",
            failure: "https://tenisymas.com/failure",
            cancel: "https://tenisymas.com/cancel"
        },
        shippingAddress: {
            line1: "Calle 123",
            city: "BOGOTA",
            administrativeDivision: "BOGOTA",
            country: "CO"
        },
        client: {
            idType: "CC",
            idNumber: "1234567890",
            firstName: "JUAN",
            lastName: "PRUEBA",
            email: "juan@example.com",
            cellphone: "3001234567"
        },
        items: [{
            sku: "SKU-001",
            name: "TENIS PRUEBA",
            quantity: 1,
            unitPrice: 150000,
            category: "FASHION"
        }]
    };

    await testTargeted("Full Payload with numeric ID and administrativeDivision", payload);

    // Test if 'id' field is required instead of 'orderId'
    const payloadWithId = { ...payload, id: payload.orderId };
    delete payloadWithId.orderId;
    await testTargeted("Full Payload with 'id' instead of 'orderId'", payloadWithId);
}

run().catch(console.error);
