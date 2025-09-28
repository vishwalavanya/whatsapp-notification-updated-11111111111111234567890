require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔹 Read Twilio credentials from .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER; // should be +14155238886 (sandbox number)

// 🔹 Create Twilio client
const client = twilio(accountSid, authToken);

// test endpoint
app.get('/', (req, res) => {
  res.send('Twilio WhatsApp Server is running ✅');
});

// 🔹 Endpoint to send WhatsApp message
app.post('/send-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;

    // 🔹 build custom message
    const bodyText = `New message from Ammu: ${message}`;

    // 🔹 send message
    const msg = await client.messages.create({
      from: `whatsapp:${twilioPhone}`,
      to: `whatsapp:${to}`,
      body: bodyText
    });

    console.log('✅ WhatsApp message sent SID:', msg.sid);
    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    console.error('❌ Error sending message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
