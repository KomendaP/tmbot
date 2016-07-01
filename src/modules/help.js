var msg = require('../config.json').help.join('\n\t');
module.exports = function (bot, message) {
  bot.reply(message, msg);
};