const express = require('express');
const https   = require('https');
const app     = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID   = process.env.CHAT_ID;

// Send message to Telegram using native https — no fetch needed
function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id:    CHAT_ID,
      text:       text,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      path:     `/bot${BOT_TOKEN}/sendMessage`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    console.log('Sending to Telegram...');
    console.log('BOT_TOKEN length:', BOT_TOKEN ? BOT_TOKEN.length : 'NOT SET');
    console.log('CHAT_ID value:', CHAT_ID);
    console.log('Path:', options.path.substring(0, 20) + '...');

    console.log('Telegram URL path:', `/bot${BOT_TOKEN}/sendMessage`);
    console.log('CHAT_ID being used:', CHAT_ID);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.ok) {
            console.error('Telegram error:', JSON.stringify(parsed));
          } else {
            console.log('Telegram sent successfully — message_id:', parsed.result.message_id);
          }
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      console.error('HTTPS request error:', err.message);
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

// Format signal message
function formatSignal(payload) {
  const dir    = (payload.direction || 'unknown').toUpperCase();
  const symbol = payload.symbol   || '—';
  const entry  = payload.entry    || '—';
  const stop   = payload.stop     || '—';
  const target = payload.target   || '—';
  const prob   = payload.prob_buy || payload.prob_sell || '—';
  const td     = payload.top_down || '—';
  const time   = payload.time     || '—';

  const emoji = dir === 'LONG' ? '🟢' : '🔴';
  const label = dir === 'LONG' ? '▲ LONG' : '▼ SHORT';

  return (
    emoji + ' <b>GOLDEN CANDLE SIGNAL</b>\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    '<b>' + label + '</b>  ' + symbol + '\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    '📍 Entry:   <b>' + entry  + '</b>\n' +
    '🛑 Stop:    <b>' + stop   + '</b>\n' +
    '🎯 Target:  <b>' + target + '</b>\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    '📊 Prob:    <b>' + prob + '%</b>\n' +
    '🔭 Flow:    ' + td + '\n' +
    '🕐 Time:    ' + time + '\n' +
    '━━━━━━━━━━━━━━━━━━━━\n' +
    '⚠️ <i>Always use proper risk management</i>'
  );
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body));

  try {
    const payload = req.body;

    if (payload.type === 'signal') {
      const message = formatSignal(payload);
      await sendTelegram(message);
    } else {
      console.log('Non-signal type:', payload.type);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Golden Candle Webhook Server is running ✦');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
  console.log('BOT_TOKEN set:', !!BOT_TOKEN);
  console.log('CHAT_ID set:', !!CHAT_ID);
});
