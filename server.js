const express = require('express');
const https   = require('https');
const app     = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID   = process.env.CHAT_ID;

function sendTelegram(text) {
  return new Promise(function(resolve, reject) {
    var body = JSON.stringify({
      chat_id:    CHAT_ID,
      text:       text,
      parse_mode: 'HTML'
    });

    console.log('BOT_TOKEN length:', BOT_TOKEN ? BOT_TOKEN.length : 'NOT SET');
    console.log('CHAT_ID:', CHAT_ID);

    var options = {
      hostname: 'api.telegram.org',
      path:     '/bot' + BOT_TOKEN + '/sendMessage',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);
          if (!parsed.ok) {
            console.error('Telegram error:', JSON.stringify(parsed));
          } else {
            console.log('Telegram sent OK message_id:', parsed.result.message_id);
          }
          resolve(parsed);
        } catch(e) {
          reject(e);
        }
      });
    });

    req.on('error', function(err) {
      console.error('Request error:', err.message);
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

function formatSignal(payload) {
  var dir    = (payload.direction || 'unknown').toUpperCase();
  var symbol = payload.symbol   || '-';
  var entry  = payload.entry    || '-';
  var stop   = payload.stop     || '-';
  var target = payload.target   || '-';
  var prob   = payload.prob_buy || payload.prob_sell || '-';
  var td     = payload.top_down || '-';
  var time   = payload.time     || '-';
  var label  = dir === 'LONG' ? 'LONG' : 'SHORT';
  var signal = dir === 'LONG' ? 'BUY SIGNAL' : 'SELL SIGNAL';

  return '<b>GOLDEN CANDLE ' + signal + '</b>\n' +
    '--------------------\n' +
    '<b>' + label + '</b>  ' + symbol + '\n' +
    '--------------------\n' +
    'Entry:   <b>' + entry  + '</b>\n' +
    'Stop:    <b>' + stop   + '</b>\n' +
    'Target:  <b>' + target + '</b>\n' +
    '--------------------\n' +
    'Prob:    <b>' + prob + '%</b>\n' +
    'Flow:    ' + td + '\n' +
    'Time:    ' + time + '\n' +
    '--------------------\n' +
    '<i>Always use proper risk management</i>';
}

app.post('/webhook', function(req, res) {
  console.log('Webhook received:', JSON.stringify(req.body));

  var payload = req.body;

  if (payload.type === 'signal') {
    var message = formatSignal(payload);
    sendTelegram(message)
      .then(function() {
        res.status(200).json({ status: 'ok' });
      })
      .catch(function(err) {
        console.error('Send error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
      });
  } else {
    console.log('Non-signal type:', payload.type);
    res.status(200).json({ status: 'ok' });
  }
});

app.get('/', function(req, res) {
  res.send('Golden Candle Webhook Server running');
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Server running on port', PORT);
  console.log('BOT_TOKEN set:', !!BOT_TOKEN);
  console.log('CHAT_ID set:', !!CHAT_ID);
});
