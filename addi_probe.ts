
const ADDI_CLIENT_ID = "XPCJ6zuqe1RkhymHCriEdTYHZ68DVEAK";
const ADDI_CLIENT_SECRET = "7EZUBwjhpoLncnmCcz9KcZXPJy1PW7Hj4eVvK6qsO0TAFh_J5CUHbVPe1SpiKj15";

async function probe() {
    console.log("--- Addi Probe Start ---");

    // 1. Auth
    const authPayload = {
        client_id: ADDI_CLIENT_ID,
        client_secret: ADDI_CLIENT_SECRET,
        audience: "https://api.addi.com",
        grant_type: 'client_credentials',
    };

    const authRes = await fetch(`https://auth.addi.com/oauth/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(authPayload),
    });

    const authData = await authRes.json();
    if (!authRes.ok) {
        console.error("Auth Failed:", authData);
        return;
    }
    const token = authData.access_token;
    console.log("Auth Success. Token length:", token.length);

    const allySlug = "tennisymasco-ecommerce";
    const endpoints = [
        "https://api.addi.com/v1/applications",
        "https://api.addi.com/v1/online-applications",
        "https://api.addi.com/v1/applications/online",
        "https://api.addi.com/v2/applications",
        "https://api.addi.com/v2/online-applications",
        "https://api.addi.com/v3/checkout-sessions",
        "https://api.addi.com/checkout/sessions",
        "https://api.addi.com/allies/" + allySlug + "/applications",
        "https://api.addi.com/v1/allies/" + allySlug + "/applications"
    ];

    const body = {
        allySlug: allySlug,
        totalAmount: 100000,
        currency: "COP",
        orderId: "PROBE-" + Date.now(),
        items: [{ sku: "1", name: "Probe Item", quantity: 1, unitPrice: 100000 }],
        client: {
            idType: "CC",
            idNumber: "123456",
            firstName: "Probe",
            lastName: "Test",
            email: "probe@test.com",
            cellphone: "3001234567"
        },
        shippingAddress: { line1: "Probe Address", city: "Bogota", country: "CO" },
        redirectionUrls: {
            success: "https://example.com/success",
            failure: "https://example.com/failure",
            cancel: "https://example.com/cancel"
        }
    };

    for (const url of endpoints) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url, {
                method: "POST",
                redirect: "manual",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Ally-Slug": allySlug
                },
                body: JSON.stringify(body)
            });

            console.log(`Status: ${res.status}`);
            const location = res.headers.get("location");
            if (location) console.log(`Location: ${location}`);

            const data = await res.json().catch(() => null);
            if (data) console.log("Response:", JSON.stringify(data).substring(0, 200));

        } catch (e) {
            console.error("Error at " + url + ":", e.message);
        }
    }
}

probe();
