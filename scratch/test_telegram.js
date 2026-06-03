const { sendTelegram } = require('../utils/telegram');

(async () => {
  try {
    const title = '✅ *¡NUEVA VENTA CONFIRMADA (Mercado Pago)!*';
    const customerName = 'Jennifer Cala Pineda';
    const city = 'Barrancabermeja';
    const phone = '3102981662';
    const total = '$176.500';
    const items = '- 1x FUTSAL GATO SUPREME BLANCO CHULO AZUL Y ROJO';
    const message = `\n${title}\n----------------------------\n👤 *Cliente:* ${customerName}\n📍 *Ciudad:* ${city}\n📱 *Teléfono:* ${phone}\n💰 *Total:* ${total}\n📦 *Productos:*\n${items}\n`;
    await sendTelegram(message.trim());
    console.log('Mensaje de prueba enviado.');
  } catch (e) {
    console.error('Error al enviar mensaje de prueba:', e);
  }
})();
