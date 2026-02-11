
const ALLY_SLUG = "tennisymasco-ecommerce";

async function run() {
    const url = `https://channels-public-api.addi.com/allies/${ALLY_SLUG}/config?requestedAmount=150000`;
    console.log(`Testing: ${url}`);

    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response: ${data}`);
}

run().catch(console.error);
