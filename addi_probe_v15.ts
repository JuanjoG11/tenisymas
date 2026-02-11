
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";
const ALLY_SLUG = "tennisymasco-ecommerce";

async function run() {
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

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);

    const payload = {
        allySlug: ALLY_SLUG,
        totalAmount: 150000,
        currency: "COP",
        orderId: "V15-" + Date.now(),
        expirationTime: expiration.toISOString(),
        redirectionUrls: {
            success: "https://tenisymas.com/success",
            failure: "https://tenisymas.com/failure",
            cancel: "https://tenisymas.com/cancel"
        },
        shippingAddress: { line1: "CALLE 123", city: "BOGOTA", country: "CO" },
        client: {
            idType: "CC",
            idNumber: "1234567890",
            firstName: "JUAN",
            lastName: "PRUEBA",
            email: "juan@test.com",
            cellphone: "3001234567"
        },
        items: [{ sku: "1", name: "ITEM", quantity: 1, unitPrice: 150000, category: "Fashion" }]
    };

    const url = "https://api.addi.com/v1/online-applications";
    console.log(`Testing: ${url} with X-Region: CO`);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
            "X-Ally-Slug": ALLY_SLUG,
            "X-Region": "CO"
        },
        body: JSON.stringify(payload)
    });

    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
}

run().catch(console.error);
