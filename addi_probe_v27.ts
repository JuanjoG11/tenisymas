
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";
const ALLY_SLUG = "tennisymasco-ecommerce";

async function test(name, url, body) {
    console.log(`\n--- Testing: ${name} ---`);
    console.log(`URL: ${url}`);

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

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
            "X-Ally-Slug": ALLY_SLUG
        },
        body: JSON.stringify(body)
    });

    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
}

async function run() {
    const basePayload = {
        totalAmount: 100000,
        currency: "COP",
        orderId: "V27-" + Date.now(),
        client: {
            idType: "CC",
            idNumber: "12345678",
            firstName: "JUAN",
            lastName: "TEST",
            email: "juan@test.com",
            cellphone: "3001234567"
        },
        items: [{
            sku: "1",
            name: "TEST",
            quantity: 1,
            unitPrice: 100000,
            category: "Fashion"
        }],
        shippingAddress: {
            line1: "CALLE 123",
            city: "BOGOTA",
            country: "CO"
        },
        redirectionUrls: {
            success: "https://example.com/s",
            failure: "https://example.com/f",
            cancel: "https://example.com/c"
        }
    };

    await test("v1/online-applications WITHOUT allySlug in body",
        "https://api.addi.com/v1/online-applications",
        basePayload);

    await test("v1/allies/{slug}/applications WITHOUT allySlug in body",
        `https://api.addi.com/v1/allies/${ALLY_SLUG}/applications`,
        basePayload);
}

run().catch(console.error);
