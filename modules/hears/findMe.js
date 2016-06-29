var config = require('../data.json').findMe;
var requestify = require('requestify');

//Random search
function getRandomRes(bot, message, options) {
  var r = (Math.random() * 100 % 10), name, sufix;

  if (r >= 0 && r < 2) {
    name = 'Sport';
    sufix = ' sport.';
  } else if (r >= 2 && r < 4) {
    name = 'Film';
    sufix = ' films.';
  } else if (r >= 4 && r < 6) {
    name = 'Family';
    sufix = ' family.';
  } else if (r >= 6 && r < 8) {
    name = 'Music';
    sufix = ' music.';
  } else if (r >= 8 && r <= 10) {
    name = 'Play';
    sufix = ' plays.';
  }
  options.classificationName = name;
  bot.reply(message, 'You and your friends usually search for' + sufix);
}

// "events" is an array of Ticketmaster event information
function eventInfo(events) {
  var str = '', event, place, startDate, counter;

  for (var i = 0; i < events.length; i++) {
    event = events[i];
    startDate = event.dates.start;
    place = event._embedded.venues[0].name ? ['in', event._embedded.venues[0].name].join(' '): '';
    counter = ['*', i + 1, '* -'].join('');
    str = [
      str,
      counter,
      event.name,
      place,
      '\n',
      startDate.localTime,
      startDate.localDate,
      '\n\n'
    ].join(' ');
  }
  return str;
}

module.exports = function (d2) {
  return function (bot, message) {
    var keyword = message.match[1].trim(),
      options = {};
    console.error(keyword);

    console.log(message);

    if (!keyword) {
      keyword = '';
      getRandomRes(bot, message, options);
    }

    options.keyword = keyword;
    options.size = config.options.quantity;

    d2.event
      .all(options)
      .then(function(events) {

        var str = eventInfo(events);
        console.log(str);

        bot.reply(message, str);
        //http://api.page2images.com/restfullink?p2i_size=480x720&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=LvZ184t4Qfovi_GmuZZRd&p2i_key=887ae1bc9e2f335f
        // start a conversation to handle this response.
        var success;
        bot.startConversation(message, function(err, convo) {
          convo.ask('Do you need details? Say number or NO.', function(response,convo) {
            convo.say('Cool, you said: ' + response.text);
            var n = parseInt(response.text);

            if (n && n > 0 && n <= events.length) {
              success = 'ok';
              i = n - 1;
              var rich = {
                "attachments": [
                  {
                    "title": events[i].name || "",
                    "pretext": events[i]._embedded.venues[0].name + events[i].dates.start.localTime + ' ' + events[i].dates.start.localDate,
                    "text": events[i].info,
                    "mrkdwn_in": ["text", "pretext"],
                    "image_url": events[i].images[0].url
                  }
                ]
              };
              bot.reply(message, rich);
            }
            console.log('NNNNNNNNNNNNNNNNNN' + success);
            if (success) {
              bot.startConversation(message,function(err,convo) {
                convo.ask('Do you need ticket? Say YES or NO.', function(response, convo) {
                  convo.say('Cool, you said: ' + response.text);
                  if (response.text == 'YES') {

                    var ticket;
                    var estimated_need_time = 5;

                    requestify.get('http://api.page2images.com/restfullink?p2i_size=480x720&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=' + events[i].id + '&p2i_key=887ae1bc9e2f335f')
                      .then(function(response) {
                        // Get the response body (JSON parsed or jQuery object for XMLs)
                        console.log(response.getBody());
                        var result = JSON.parse(response.getBody());
                        if (result.image_url) {
                          ticket = result.image_url;
                        } else {
                          if (result.estimated_need_time) {
                            estimated_need_time = parseInt(result.estimated_need_time);
                            console.log('WE NEED '+estimated_need_time);
                          }
                        }
                      });

                    if (!ticket) {
                      console.log('WE WILL try later');
                      setTimeout(function () {
                        console.log('GET IAMGE');
                        requestify
                          .get('http://api.page2images.com/restfullink?p2i_size=480x720&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=' + events[i].id + '&p2i_key=887ae1bc9e2f335f')
                          .then(function (response) {
                            // Get the response body (JSON parsed or jQuery object for XMLs)
                            console.log(response.getBody());
                            var result = JSON.parse(response.getBody());
                            if (result.image_url) {
                              ticket = result.image_url;
                              var rich = {
                                "attachments": [
                                  {
                                    "title": "Your ticket",
                                    "image_url": ticket
                                  }
                                ]
                              };
                              bot.reply(message, rich);
                            }
                          });
                      }, estimated_need_time * 1000);
                    }
                  }
                  convo.next();
                });
              });
            }
            convo.next();
          });
        });
      })
      .catch(function (err) {
        bot.reply(message, 'Sorry, no results on your request!');
      });
  }
};