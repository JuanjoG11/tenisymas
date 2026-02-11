
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";
const ALLY_SLUG = "tennisymasco-ecommerce";

async function run() {
    console.log("--- Testing Variation: addi-prod.auth0.com ---");

    // Auth attempt with addi-prod.auth0.com
    const authRes = await fetch("https://addi-prod.auth0.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: ADDI_CLIENT_ID,
            client_secret: ADDI_CLIENT_SECRET,
            audience: "https://api.addi.com",
            grant_type: "client_credentials",
        }),
    });

    if (!authRes.ok) {
        console.log("Auth with addi-prod.auth0.com failed, falling back to auth.addi.com");
        return;
    }

    const { access_token } = await authRes.json();
    console.log("Auth Success with addi-prod.auth0.com");

    const payload = {
        allySlug: ALLY_SLUG,
        totalAmount: 100000,
        currency: "COP",
        orderId: "V20-" + Date.now(),
        client: {
            idType: "CC",
            idNumber: "123456789",
            firstName: "Juan",
            lastName: "Perez",
            email: "test@test.com",
            cellphone: "3001234567"
        },
        items: [{ sku: "1", name: "Test", quantity: 1, unitPrice: 100000 }],
        shippingAddress: { line1: "Calle 123", city: "Bogota", country: "CO" },
        // Try these names mentioned in the old walkthrough
        redirectionUrls: {
            successUrl: "https://tenisymas.com/success.html",
            declinedUrl: "https://tenisymas.com/checkout.html",
            abandonedUrl: "https://tenisymas.com/checkout.html"
        }
    };

    const url = "https://api.addi.com/v1/online-applications";

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`
        },
        body: JSON.stringify(payload)
    });

    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
}

run().catch(console.error);
