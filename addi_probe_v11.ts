
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";
const ALLY_SLUG = "tennisymasco-ecommerce";

async function testVariation(name, payloadMod = {}, audience = "https://api.addi.com") {
    console.log(`\n--- Testing Variation: ${name} (Audience: ${audience}) ---`);

    // Auth
    const authRes = await fetch("https://auth.addi.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: ADDI_CLIENT_ID,
            client_secret: ADDI_CLIENT_SECRET,
            audience: audience,
            grant_type: "client_credentials",
        }),
    });
    const { access_token } = await authRes.json();

    const basePayload = {
        allySlug: ALLY_SLUG,
        totalAmount: 100000,
        currency: "COP",
        orderId: "PRB-" + Date.now(),
        client: {
            idType: "CC",
            idNumber: "12345678",
            firstName: "JUAN",
            lastName: "PRUEBA",
            email: "juan@test.com",
            cellphone: "3001234567"
        },
        items: [{ sku: "1", name: "ITEM", quantity: 1, unitPrice: 100000 }],
        shippingAddress: { line1: "CALLE 123", city: "BOGOTA", country: "CO" },
        redirectionUrls: {
            success: "https://example.com/s",
            failure: "https://example.com/f",
            cancel: "https://example.com/c"
        }
    };

    const finalPayload = { ...basePayload, ...payloadMod };
    if (payloadMod.client) finalPayload.client = { ...basePayload.client, ...payloadMod.client };

    const res = await fetch("https://api.addi.com/v1/online-applications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
            "X-Ally-Slug": ALLY_SLUG
        },
        body: JSON.stringify(finalPayload)
    });

    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
}

async function run() {
    await testVariation("idType as COL_CC", { client: { idType: "COL_CC" } });
    await testVariation("Audience with trailing slash", {}, "https://api.addi.com/");
    await testVariation("Both idType COL_CC and trailing slash", { client: { idType: "COL_CC" } }, "https://api.addi.com/");
    await testVariation("Using 'birthDate' and 'gender' with 'COL_CC'", { client: { idType: "COL_CC", birthDate: "1990-01-01", gender: "MALE" } });
}

run().catch(console.error);
