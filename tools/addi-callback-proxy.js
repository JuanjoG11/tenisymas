// Example Addi callback proxy
// Usage: set SUPABASE_ADDI_CALLBACK_URL to the Supabase function URL (or rely on default)
// Deploy this on your server under https://tenisymas.com and ensure /addi-callback is reachable.

const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TARGET = process.env.SUPABASE_ADDI_CALLBACK_URL || 'https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/addi-callback';

app.post('/addi-callback', async (req, res) => {
  try {
    // Optional: implement simple validation here (IP allowlist, header token, etc.)
    const body = req.body || {};

    // Forward the body to the Supabase function
    const forwardRes = await fetch(TARGET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await forwardRes.text();
    res.status(forwardRes.status).send(text);
  } catch (err) {
    console.error('Proxy error forwarding Addi callback:', err);
    res.status(500).send('Proxy error');
  }
});

app.get('/', (req, res) => res.send('Addi callback proxy is running'));

app.listen(PORT, () => console.log(`Addi callback proxy listening on port ${PORT}, forwarding to ${TARGET}`));
