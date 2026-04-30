const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID   = process.env.CHAT_ID;

console.log('Starting server...');
console.log('BOT_TOKEN set:', !!BOT_TOKEN);
console.log('BOT_TOKEN length:', BOT_TOKEN ? BOT_TOKEN.length : 0);
console.log('CHAT_ID:', CHAT_ID);

const bot = new TelegramBot(BOT_TOKEN);

function formatSignal(payload) {
  var dir    = (payload.direction || 'unknown').toUpperCase();
  var symbol = payload.symbol   || '-';
  var entry  = payload.entry    || '-';
  var stop   = payload.stop     || '-';
  var target = payload.target   || '-';
  var prob   = payload.prob_buy || payload.prob_sell || '-';
  var td     = payload.top_down || '-';
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
    '--------------------\n' +
    '<i>Always use proper risk management</i>';
}

app.post('/webhook', function(req, res) {
  console.log('Webhook received:', JSON.stringify(req.body));

  var payload = req.body;

  if (payload.type === 'signal') {
    var message = formatSignal(payload);
    bot.sendMessage(CHAT_ID, message, { parse_mode: 'HTML' })
      .then(function(result) {
        console.log('Telegram sent OK:', result.message_id);
        res.status(200).json({ status: 'ok' });
      })
      .catch(function(err) {
        console.error('Telegram error:', err.message);
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
});
