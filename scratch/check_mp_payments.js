const ACCESS_TOKEN = "APP_USR-8626270631469210-022013-797bdb9a76a3d85b866049fb85eb4e38-3213704453";

async function fetchRecentPayments() {
    try {
        console.log("Fetching recent payments from Mercado Pago...");
        // Search payments, sorted by date_created desc
        const url = "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=5";
        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            }
        });
        
        if (!res.ok) {
            console.error("Error from Mercado Pago search API:", res.status, await res.text());
            return;
        }

        const data = await res.json();
        console.log(`Found ${data.results.length} recent payments:`);
        
        for (const payment of data.results) {
            console.log("-----------------------------------------");
            console.log(`ID: ${payment.id}`);
            console.log(`Date Created: ${payment.date_created}`);
            console.log(`Status: ${payment.status} (${payment.status_detail})`);
            console.log(`Total Amount: ${payment.transaction_amount}`);
            console.log(`External Reference: ${payment.external_reference}`);
            console.log(`Payer Email: ${payment.payer ? payment.payer.email : 'N/A'}`);
            console.log("Metadata:", JSON.stringify(payment.metadata, null, 2));
        }
    } catch (e) {
        console.error("Script error:", e);
    }
}

fetchRecentPayments();
