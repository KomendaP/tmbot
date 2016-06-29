var data = require('../data.json').findMe;

module.exports = function (d2) {
  return function (bot, message) {
    var keyword = message.match[1];
    var options = {};

    console.log(message);

    if (!keyword) {
      keyword = '';
      var r = Math.random();

      if (r >= 0 && r < 0.2) {
        options.classificationName = 'Sport';
        bot.reply(message, 'You and your friends usually search for sport.');
      }
      if (r >= 0.2 && r < 0.4) {
        options.classificationName = 'Film';
        bot.reply(message, 'You and your friends usually search for films.');
      }
      if (r >= 0.4 && r < 0.6) {
        options.classificationName = 'Family';
        bot.reply(message, 'You and your friends usually search for family.');
      }
      if (r >= 0.6 && r < 0.8) {
        options.classificationName = 'Music';
        bot.reply(message, 'You and your friends usually search for music.');
      }
      if (r >= 0.8 && r <= 1) {
        options.classificationName = 'Play';
        bot.reply(message, 'You and your friends usually search for plays.');
      }
    }

    options.keyword = keyword;
    options.size = 5;
    d2.event
      .all(options)
      .then(function(events) {
        // "events" is an array of Ticketmaster event information
        var str = '';
        for (var i = 0; i < events.length; i++){
          //console.log(events[i]);
          str = str + ' ' + (i + 1) + ' ' + events[i].name + ' in ' + events[i]._embedded.venues[0].name + '\n';
          str = str + events[i].dates.start.localTime + ' ' + events[i].dates.start.localDate + '\n\n';
        }

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
                    var requestify = require('requestify');

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
      });
  }
};