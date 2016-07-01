var config = require('../config.json').findMe;
var requestify = require('requestify');

// Random search
function getRandomRes() {
  return config.randomOptions[~~(Math.random() * 100) % config.randomOptions.length];
}

// "events" is an array of Ticketmaster event information
function eventInfo(arr) {
  var str = '', event, place, startDate;

  for (var i = 0; i < arr.length; i++) {
    event = arr[i];
    startDate = event.dates.start;
    place = event._embedded.venues[0].name ? `in ${event._embedded.venues[0].name}`: '';
    str = `${str} *${i + 1}* - ${event.name} ${place}\n ${startDate.localTime} ${startDate.localDate}\n\n`;
  }
  return str;
}

function getAttachemens(event) {
  "use strict";
  let startDate = event.dates.start;

  return {
    attachments: [
      {
        title: event.name || "",
        pretext: `${event._embedded.venues[0].name || ''} ${startDate.localTime} ${startDate.localDate}`,
        text: event.info,
        mrkdwn_in: [
          "text",
          "pretext"
        ],
        image_url: event.images[0].url
      }
    ]
  };
}

/**
 * http://api.page2images.com/restfullink?p2i_size=480x720&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=LvZ184t4Qfovi_GmuZZRd&p2i_key=887ae1bc9e2f335f
 * start a conversation to handle this response.
 * @param events
 */

let errorHandler = (err) => {
  bot.reply(message, 'Sorry, no results on your request!');
};

module.exports = d2 => (bot, message) => {
  let keyword = message.match[1] && message.match[1].trim(),
    options = {};

  /**
   * Random options
   */
  if (!keyword) {
    let option = getRandomRes();
    options.classificationName = option;
    bot.reply(message, `You and your friends usually search for ${option.toLowerCase()}.`)
  }

  options.keyword = keyword || '';
  options.size = config.options.quantity;

  d2.event
    .all(options)
    .then(events => {
      bot.reply(message, eventInfo(events));
      bot.startConversation(message, (err, convo) => {
        convo.ask('Do you need details? Say number or NO.', (response, convo) => {
          let answer = response.text;
          convo.say(`Cool, you said: ${answer}`);

          let n = Number.parseInt(answer, 10);

          if (n && n > 0 && n <= events.length) {
            let i = n - 1;
            let rich = getAttachemens(events[i]);
            bot.reply(message, rich);
            bot.startConversation(message, function(err, convo) {
              convo.ask('Do you need ticket? Say YES or NO.', (response, convo) => {
                let answer = response.text;
                convo.say(`Cool, you said: ${answer}`);
                if (answer.toLowerCase().match(/(y|yes)/)) {

                  var ticket;
                  let estimated_need_time = 5;

                  requestify
                    .get([config.reqUrl.base, events[i].id, config.reqUrl.sufix].join(''))
                    .then(function(response) {
                      // Get the response body (JSON parsed or jQuery object for XMLs)
                      console.log(response.getBody());
                      var result = JSON.parse(response.getBody());
                      if (result.image_url) {
                        ticket = result.image_url;
                      } else {
                        if (result.estimated_need_time) {
                          estimated_need_time = Number.parseInt(result.estimated_need_time, 10);
                        }
                      }
                    });

                  if (!ticket) {
                    setTimeout(function () {
                      console.log('GET IAMGE');
                      requestify
                        .get([config.reqUrl.base, events[i].id, config.reqUrl.sufix].join(''))
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
    .catch(errorHandler);
};