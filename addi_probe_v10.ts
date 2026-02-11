
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";
const ALLY_SLUG = "tennisymasco-ecommerce";

async function run() {
    // 1. Auth
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
    console.log("Auth successful");

    const endpoints = [
        "https://api.addi.com/v1/online-applications",
        "https://api.addi.com/v1/applications",
        "https://api.addi.com/v2/online-applications"
    ];

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
        shippingAddress: { line1: "CLL 1", city: "BOGOTA", country: "CO" },
        redirectionUrls: {
            success: "https://tenisymas.com/success",
            failure: "https://tenisymas.com/failure",
            cancel: "https://tenisymas.com/cancel"
        }
    };

    for (const url of endpoints) {
        console.log(`\nTesting: ${url}`);

        // Variation 1: cellphone
        const res1 = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`,
                "X-Ally-Slug": ALLY_SLUG
            },
            body: JSON.stringify(basePayload)
        });
        console.log(`V1 (cellphone) Status: ${res1.status}`);
        const data1 = await res1.text();
        console.log(`V1 Response: ${data1}`);

        // Variation 2: phoneNumber
        const payload2 = JSON.parse(JSON.stringify(basePayload));
        delete payload2.client.cellphone;
        payload2.client.phoneNumber = "3001234567";
        const res2 = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`,
                "X-Ally-Slug": ALLY_SLUG
            },
            body: JSON.stringify(payload2)
        });
        console.log(`V2 (phoneNumber) Status: ${res2.status}`);
        const data2 = await res2.text();
        console.log(`V2 Response: ${data2}`);
    }
}

run().catch(console.error);
