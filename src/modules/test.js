module.exports = function (bot, message) {
  bot.reply(message, 'http://api.page2images.com/directlink?p2i_size=500x0&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=LvZ184t4Qfovi_GmuZZRd&p2i_key=3ffe4d179f686d6f');
  //  bot.reply(message, 'http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=LvZ184t4Qfovi_GmuZZRd');
  var cm = {
    "text": "Would you like to play a game?",
    "attachments": [
      {
        "text": "Choose a game to play",
        "fallback": "You are unable to choose a game",
        "callback_id": "wopr_game",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "actions": [
          {
            "name": "chess",
            "text": "Chess",
            "type": "button",
            "value": "chess"
          },
          {
            "name": "maze",
            "text": "Falken's Maze",
            "type": "button",
            "value": "maze"
          },
          {
            "name": "war",
            "text": "Thermonuclear War",
            "style": "danger",
            "type": "button",
            "value": "war",
            "confirm": {
              "title": "Are you sure?",
              "text": "Wouldn't you prefer a good game of chess?",
              "ok_text": "Yes",
              "dismiss_text": "No"
            }
          }
        ]
      }
    ]
  };
  bot.reply(message, cm);
};