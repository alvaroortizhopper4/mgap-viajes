// Servicio para enviar mensajes de WhatsApp usando Twilio
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // Ej: 'whatsapp:+14155238886'

const client = twilio(accountSid, authToken);

async function sendWhatsAppMessage(to, message) {
  try {
    const msg = await client.messages.create({
      from: whatsappFrom,
      to: `whatsapp:${to}`,
      body: message,
    });
    return msg;
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    throw error;
  }
}

module.exports = { sendWhatsAppMessage };