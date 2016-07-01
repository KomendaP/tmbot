module.exports = function (bot, message) {
  bot.reply(message, [
    '*Type:*',
    'Find me {keyword}',
    'What on {city}',
    'Events (today|tomorrow,this week|next week)',
    'Give me {classification name}',
    'Surprise me.'
  ].join('\n\t'));
};