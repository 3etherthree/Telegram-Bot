const express = require('express');
const app     = express();
app.use(express.json());

// ── CONFIG ── replace these two values ──────────────────────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN;   // set in Railway environment variables
const CHAT_ID   = process.env.CHAT_ID;     // set in Railway environment variables
// ────────────────────────────────────────────────────────────────────────────

// Send a message to Telegram
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = JSON.stringify({
    chat_id:    CHAT_ID,
    text:       text,
    parse_mode: 'HTML'
  });
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    body
  });
  const data = await res.json();
  if (!data.ok) {
    console.error('Telegram error:', JSON.stringify(data));
  }
  return data;
}

// Format the signal message for Telegram
function formatSignal(payload) {
  const dir    = payload.direction?.toUpperCase() || 'UNKNOWN';
  const symbol = payload.symbol  || '—';
  const entry  = payload.entry   || '—';
  const stop   = payload.stop    || '—';
  const target = payload.target  || '—';
  const prob   = payload.prob_buy || payload.prob_sell || '—';
  const td     = payload.top_down || '—';
  const time   = payload.time    || '—';

  const emoji  = dir === 'LONG' ? '🟢' : '🔴';
  const label  = dir === 'LONG' ? '▲ LONG' : '▼ SHORT';

  return (
    `${emoji} <b>GOLDEN CANDLE SIGNAL</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>${label}</b>  ${symbol}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📍 Entry:   <b>${entry}</b>\n` +
    `🛑 Stop:    <b>${stop}</b>\n` +
    `🎯 Target:  <b>${target}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 Prob:    <b>${prob}%</b>\n` +
    `🔭 Flow:    ${td}\n` +
    `🕐 Time:    ${time}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ <i>Always use proper risk management</i>`
  );
}

// Main webhook endpoint — TradingView posts here
app.post('/webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body));

  try {
    const payload = req.body;

    // Only send Telegram message for signal type alerts
    if (payload.type === 'signal') {
      const message = formatSignal(payload);
      await sendTelegram(message);
      console.log('Telegram sent successfully');
    } else {
      // Other alert types (bias change, OB detected, etc.) — log only
      console.log('Non-signal alert type:', payload.type);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Health check — visit your Railway URL to confirm server is alive
app.get('/', (req, res) => {
  res.send('Golden Candle Webhook Server is running ✦');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
