/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./node_modules/botkit/lib/Botkit.js');
var os = require('os');

var TM = require('ticketmaster');
var d2 = TM('4xtBeBzeiKY7k73xilQsLxVpPpEAxhQh').discovery.v2;

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();





controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
            d2.event.all()
            .then(function(events) {
              // "events" is an array of Ticketmaster event information
              console.log(events);
            });
            bot.reply(message, events);
        } else {
            bot.reply(message, 'Hello. Say help for support.');
            var TM = require('ticketmaster');


            
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name', 'status'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });



controller.hears(['help', 'how can I use you', 'who is you purpose', 'help me', 'guide'],
    'direct_message,direct_mention,mention', function(bot, message) {

        bot.reply(message,
            'Type:' + '\n'+
            'Find me {keyword}'+'\n'+
            'What on {city}'+'\n'+
            'Events (today|tomorrow,this week|next week)'+'\n'+
            'Give me {classification name}'+'\n'+
            'I like {artist name}'+'\n'+
            'My info'+'\n'+
            'Surprise me.'+
                 '');

    });


controller.hears(['find me (.*)', 'surprise me'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var keyword = message.match[1];
        console.log(message);
        
        var options = {}; 
    
    
        if (!keyword) {
            keyword = '';
            
            r = Math.random();
            
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
        d2.event.all(options)
            .then(function(events) {
              // "events" is an array of Ticketmaster event information
              var str = '';
              for (i=0;i<events.length;i++){
                //console.log(events[i]);
                str = str + ' ' + (i+1) + ' ' + events[i].name + ' in ' + events[i]._embedded.venues[0].name + '\n';
                str = str + events[i].dates.start.localTime + ' ' + events[i].dates.start.localDate + '\n\n';
              }
              console.log(str);
              bot.reply(message, str);
            
              //http://api.page2images.com/restfullink?p2i_size=480x720&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=LvZ184t4Qfovi_GmuZZRd&p2i_key=887ae1bc9e2f335f
            
            
            
            // start a conversation to handle this response.
            var success;
              bot.startConversation(message,function(err,convo) {
                  
                  

                convo.ask('Do you need details? Say number or NO.',function(response,convo) {

                  convo.say('Cool, you said: ' + response.text);
                  
                  n = parseInt(response.text);
                  if (n && n>0 && n<=events.length) {
                      success = 'ok';
                    i = n - 1;

                    var rich = {
                        "attachments": [
                            {
                                "title": events[i].name || "",
                                "pretext": events[i]._embedded.venues[0].name + events[i].dates.start.localTime + ' ' + events[i].dates.start.localDate,
                                "text": events[i].info,
                                "mrkdwn_in": ["text", "pretext"],
                                "image_url": events[i].images[0].url,
                            }
                        ]
                    }
                    bot.reply(message, rich);
                  }
                      
                    
                    
                    
                  console.log('NNNNNNNNNNNNNNNNNN'+success);
                  if (success) {
                      
                      
                                    bot.startConversation(message,function(err,convo) {
                  
                  

                                        convo.ask('Do you need ticket? Say YES or NO.',function(response,convo) {

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
                                                  }
                                                );

                                                if (!ticket) {

                                                        console.log('WE WILL try later');

                                                    setTimeout(function()
                                                        {
                                                                console.log('GET IAMGE');
                                                                            requestify.get('http://api.page2images.com/restfullink?p2i_size=480x720&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=' + events[i].id + '&p2i_key=887ae1bc9e2f335f')
                                                                              .then(function(response) {
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
                                                                                                        }
                                                                                                      bot.reply(message, rich);


                                                                                  } else {

                                                                                  }
                                                                              }
                                                                            );

                                                        }, estimated_need_time*1000);



                                                }
                                              
                                              
                                              
                                              

                                          } else {
                                              
                                          }






                                          convo.next();

                                        });





                                      });
                      
                      
                  }
                    
                  convo.next();

                });
                  
                  
                  

                  
              });
                  

            

            
            

            });

    });

controller.hears(['test'],
    'direct_message,direct_mention,mention', function(bot, message) {

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
        
    
    });


function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
