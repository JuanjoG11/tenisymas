
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";
const ALLY_SLUG = "tennisymasco-ecommerce";

async function testVariation(name, payloadMod = {}) {
    console.log(`\n--- Testing Variation: ${name} ---`);

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

    const orderId = "PROBE-" + Math.floor(Math.random() * 1000000);
    const basePayload = {
        allySlug: ALLY_SLUG,
        totalAmount: 150000,
        currency: "COP",
        orderId: orderId,
        redirectionUrls: {
            success: "https://example.com/success",
            failure: "https://example.com/failure",
            cancel: "https://example.com/cancel"
        },
        shippingAddress: {
            line1: "CALLE 123",
            city: "BOGOTA",
            country: "CO"
        },
        client: {
            idType: "CC",
            idNumber: "12345678",
            firstName: "JUAN",
            lastName: "PRUEBA",
            email: "juan.prueba@test.com",
            cellphone: "3001234567"
        },
        items: [{
            sku: "SKU-001",
            name: "TENIS DE PRUEBA",
            quantity: 1,
            unitPrice: 150000,
            category: "Fashion"
        }]
    };

    const finalPayload = { ...basePayload, ...payloadMod };

    const res = await fetch("https://api.addi.com/v1/online-applications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`
        },
        body: JSON.stringify(finalPayload)
    });

    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
}

async function runProbes() {
    await testVariation("Using 'id' instead of 'orderId'", { id: "ID-" + Date.now(), orderId: undefined });
    await testVariation("Lowercase 'fashion' category", { items: [{ sku: "SKU-001", name: "ITEM", quantity: 1, unitPrice: 150000, category: "fashion" }] });
    await testVariation("With administrativeDivision in address", { shippingAddress: { line1: "CALLE 123", city: "BOGOTA", country: "CO", administrativeDivision: "BOGOTA" } });
    await testVariation("Adding gender to client (sometimes required)", { client: { ...{ idType: "CC", idNumber: "12345678", firstName: "JUAN", lastName: "PRUEBA", email: "juan.prueba@test.com", cellphone: "3001234567" }, gender: "MALE" } });
    await testVariation("Using 'phoneNumber' AND 'cellphone'", { client: { ...{ idType: "CC", idNumber: "12345678", firstName: "JUAN", lastName: "PRUEBA", email: "juan.prueba@test.com", cellphone: "3001234567" }, phoneNumber: "3001234567" } });
}

runProbes().catch(console.error);
