const TELEGRAM_TOKEN = "8751458666:AAEEFXichBYpwLh2f86aaozkXZ8sGpnnhJw";
const TELEGRAM_CHAT_ID = "7501484183";

async function testTelegram() {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        console.log(`Sending message to ${url}...`);
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: "🤖 *Test message from Antigravity Agent*",
                parse_mode: "Markdown"
            })
        });

        const status = res.status;
        const text = await res.text();
        console.log(`Response status: ${status}`);
        console.log(`Response body: ${text}`);
    } catch (e) {
        console.error("Error:", e);
    }
}

testTelegram();
