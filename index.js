// index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Read env
const PORT = process.env.PORT || 5000;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const TEST_WHATSAPP_TO = process.env.TEST_WHATSAPP_TO;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.warn('⚠️ TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing in .env');
}
if (!TWILIO_WHATSAPP_FROM || !TEST_WHATSAPP_TO) {
  console.warn('⚠️ TWILIO_WHATSAPP_FROM or TEST_WHATSAPP_TO missing in .env');
}

// In-memory status tracker for Vishwa
let vishwaStatus = { isOnline: false, lastSeen: new Date() };

// update status: { user: "vishwa", status: "online"|"offline" }
app.post('/status', (req, res) => {
  const { user, status } = req.body;
  if (user === 'vishwa') {
    vishwaStatus.isOnline = (status === 'online');
    vishwaStatus.lastSeen = new Date();
    console.log(`✅ Vishwa status -> ${status} (isOnline=${vishwaStatus.isOnline})`);
  }
  res.json({ success: true, vishwaStatus });
});

// message endpoint: { from: "ammu", to: "vishwa", message: "..." }
app.post('/message', async (req, res) => {
  const { from, to, message } = req.body;
  console.log(`📩 ${from} -> ${to}: ${message}`);

  if (from === 'ammu' && to === 'vishwa') {
    if (!vishwaStatus.isOnline) {
      console.log('📴 Vishwa is offline — sending WhatsApp alert via Twilio Sandbox');
      try {
        const result = await sendWhatsAppNotification(message);
        console.log('✅ WhatsApp sent:', result.sid || result);
      } catch (err) {
        console.error('❌ Error sending WhatsApp:', err.message || err);
      }
    } else {
      console.log('🟢 Vishwa online — no WhatsApp sent');
    }
  }

  res.json({ success: true });
});

// Twilio WhatsApp sender
async function sendWhatsAppNotification(message) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM || !TEST_WHATSAPP_TO) {
    throw new Error('Twilio values missing in environment variables.');
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const body = `Ammu sent you a message: "${message}"\n\n(This notification was sent because you were offline)`;

  // messages.create returns a Promise
  const msg = await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: TEST_WHATSAPP_TO,
    body,
  });

  return msg;
}

// health
app.get('/', (req, res) => res.send('Twilio WhatsApp notifier running'));

// start
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
