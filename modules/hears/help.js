var msg = require('../data.json').help.join('\n\t');
module.exports = function (bot, message) {
  bot.reply(message, msg);
};