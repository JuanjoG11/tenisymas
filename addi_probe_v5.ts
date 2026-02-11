
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";

async function testSlug(slug) {
    console.log(`\n--- Testing Slug: ${slug} ---`);

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

    const payload = {
        allySlug: slug,
        totalAmount: 150000,
        currency: "COP",
        orderId: "SLG-" + Date.now(),
        redirectionUrls: {
            success: "https://example.com/success",
            failure: "https://example.com/failure",
            cancel: "https://example.com/cancel"
        },
        shippingAddress: { line1: "CALLE 123", city: "BOGOTA", country: "CO" },
        client: {
            idType: "CC",
            idNumber: "12345678",
            firstName: "JUAN",
            lastName: "PRUEBA",
            email: "juan.prueba@test.com",
            cellphone: "3001234567"
        },
        items: [{
            sku: "SKU001",
            name: "ITEM",
            quantity: 1,
            unitPrice: 150000,
            category: "Fashion"
        }]
    };

    const res = await fetch("https://api.addi.com/v1/online-applications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
            "X-Ally-Slug": slug
        },
        body: JSON.stringify(payload)
    });

    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
}

async function run() {
    await testSlug("tennisymasco-ecommerce");
    await testSlug("tenisymas-ecommerce");
    await testSlug("tenisymas");
    await testSlug("tennisymasco");
}

run().catch(console.error);
