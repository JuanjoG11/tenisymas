
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";
const ALLY_SLUG = "tennisymasco-ecommerce";

async function probeV3() {
    console.log("--- Addi V3 Probe Start ---");

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
    console.log("Auth Success.");

    const endpoints = [
        "https://api.addi.com/v3/checkout/sessions",
        "https://api.addi.com/v1/checkout/sessions",
        "https://api.co.addi.com/v3/checkout/sessions",
        "https://api.co.addi.com/v3/checkout-sessions",
        "https://api.addi.com/v3/allies/" + ALLY_SLUG + "/checkout-sessions"
    ];

    const body = {
        allySlug: ALLY_SLUG,
        totalAmount: 150000,
        currency: "COP",
        orderId: "PROBE-V3-" + Date.now(),
        client: {
            idType: "CC",
            idNumber: "1089350738",
            firstName: "JUAN",
            lastName: "COLORADO",
            email: "juanjosecolorado266@gmail.com",
            cellphone: "3117100880"
        },
        items: [{ sku: "1", name: "Probe Item", quantity: 1, unitPrice: 150000 }],
        redirectionUrls: {
            success: "https://tenisymas.com/success",
            failure: "https://tenisymas.com/failure",
            cancel: "https://tenisymas.com/cancel"
        }
    };

    for (const url of endpoints) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                    "X-Ally-Slug": ALLY_SLUG
                },
                body: JSON.stringify(body)
            });
            console.log(`Status: ${res.status}`);
            const data = await res.text();
            console.log(`Response: ${data.substring(0, 100)}`);
        } catch (e) {
            console.error("Error:", e.message);
        }
    }
}

probeV3();
