const fetch = global.fetch || require('node-fetch');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8751458666:AAEEFXichBYpwLh2f86aaozkXZ8sGpnnhJw";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "7501484183";

async function sendTelegram(msg) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" })
        });
        console.log("Telegram notification sent successfully!");
    } catch (e) {
        console.error("Telegram error:", e);
    }
}

function shouldNotifyStatus(status) {
    return String(status).toLowerCase() === 'approved';
}

module.exports = { sendTelegram, shouldNotifyStatus };
