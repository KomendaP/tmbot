var data = require('../data.json').hello;

module.exports = function (controller, d2) {
  return function (bot, message) {
    bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: 'robot_face'
    }, function(err, res) {
      if (err) {
        bot.botkit.log('Failed to add emoji reaction :(', err);
      }
    });

    controller.storage.users.get(message.user, function(err, user) {
      if (err) throw new Error(err.message);
      if (user && user.name) {
        bot.reply(message, 'Hello ' + user.name + '!');
        d2.event
          .all()
          .then(function(events) {
            // "events" is an array of Ticketmaster event information
            console.log(events);
            bot.reply(message, events);
          });
      } else {
        bot.reply(message, data.msg[0]);
      }
    });
  }
};