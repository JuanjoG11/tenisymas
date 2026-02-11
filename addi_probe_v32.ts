
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

    const payload = {
        allySlug: ALLY_SLUG,
        totalAmount: 150000,
        currency: "COP",
        orderId: "CO-" + Date.now(),
        client: {
            idType: "CC",
            idNumber: "12345678",
            firstName: "JUAN",
            lastName: "PRUEBA",
            email: "juan@test.com",
            cellphone: "3001234567"
        },
        items: [{
            sku: "1",
            name: "ITEM TEST",
            quantity: 1,
            unitPrice: 150000
            // No category here as per the walkthrough snippet
        }],
        shippingAddress: {
            line1: "Calle 123",
            city: "Bogota",
            country: "CO"
        },
        redirectionUrls: {
            success: "https://tenisymas.com/success.html",
            failure: "https://tenisymas.com/checkout.html",
            cancel: "https://tenisymas.com/checkout.html"
        }
    };

    // The endpoint from the successful walkthrough
    const url = `https://api.co.addi.com/v1/applications?ally-slug=${ALLY_SLUG}`;
    console.log(`Testing: ${url}`);

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
