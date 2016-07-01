var Botkit = require('botkit');
var TM = require('ticketmaster');

// var NODE_ENV = process.env.token;
var config = 'direct_message,direct_mention,mention';

if (!NODE_ENV) {
  console.error('Error: Specify token in environment');
  process.exit(1);
}

var d2 = TM('4xtBeBzeiKY7k73xilQsLxVpPpEAxhQh').discovery.v2;

var controller = Botkit.slackbot({debug: true/*, logLevel: 6*/});

var bot = controller.spawn({
  token: NODE_ENV
}).startRTM(function (err, bot, payload) {
  if (err) throw new Error('Could not connect to Slack');
});

controller.hears(['hello', 'hi'], config, require('./modules/hello')(controller, d2));

controller.hears(['help', 'how can I use you', 'who is you purpose', 'help me', 'guide'], config, require('./modules/help'));

controller.hears(['find me(.*)?', 'surprise me'], config, require('./modules/findMe')(d2));

controller.hears(['test'], config, require('./modules/test'));