
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
        totalAmount: 151200,
        currency: "COP",
        orderId: "O-" + Math.floor(Math.random() * 1000000),
        client: {
            idType: "CC",
            idNumber: "1020304050",
            firstName: "Juan",
            lastName: "Perez",
            email: "juan.perez@test.com",
            cellphone: "3001234567"
        },
        items: [{
            sku: "SKU12345",
            name: "Zapatos Deportivos",
            quantity: 1,
            unitPrice: 151200,
            category: "Fashion"
        }],
        shippingAddress: {
            line1: "Calle 123 # 45-67",
            city: "Bogota",
            administrativeDivision: "BOGOTA",
            country: "CO"
        },
        redirectionUrls: {
            success: "https://tenisymas.com/success.html",
            failure: "https://tenisymas.com/checkout.html",
            cancel: "https://tenisymas.com/checkout.html",
            abandoned: "https://tenisymas.com/checkout.html",
            declined: "https://tenisymas.com/checkout.html"
        }
    };

    const url = "https://api.addi.com/v1/online-applications";
    console.log(`Testing: ${url} with 5 redirection URLs and Title Case`);

    const res = await fetch(url, {
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

run().catch(console.error);
