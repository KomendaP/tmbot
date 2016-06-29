var Botkit = require('botkit');
var TM = require('ticketmaster');

var NODE_ENV_TOKEN = process.env.token;
var config = 'direct_message,direct_mention,mention';

if (!NODE_ENV_TOKEN) {
  console.error('Error: Specify token in environment');
  process.exit(1);
}

var d2 = TM('4xtBeBzeiKY7k73xilQsLxVpPpEAxhQh').discovery.v2;

var controller = Botkit.slackbot({debug: true});

var bot = controller.spawn({
  token: process.env.token
}).startRTM(function (err, bot, payload) {
  if (err) throw new Error('Could not connect to Slack');
});

controller.hears(['hello', 'hi'], config, require('./modules/hears/hello')(controller, d2));

controller.hears(['help', 'how can I use you', 'who is you purpose', 'help me', 'guide'], config, require('./modules/hears/help'));

controller.hears(['find me (.*)', 'surprise me'], config, require('./modules/hears/findMe')(d2));

controller.hears(['test'], config, require('./modules/hears/test'));
