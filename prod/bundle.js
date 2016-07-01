/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Botkit = __webpack_require__(1);
	var TM = __webpack_require__(2);
	
	// var NODE_ENV = process.env.token;
	var config = 'direct_message,direct_mention,mention';
	
	if (false) {
	  console.error('Error: Specify token in environment');
	  process.exit(1);
	}
	
	var d2 = TM('4xtBeBzeiKY7k73xilQsLxVpPpEAxhQh').discovery.v2;
	
	var controller = Botkit.slackbot({ debug: true /*, logLevel: 6*/ });
	
	var bot = controller.spawn({
	  token: ("xoxb-56065086148-skcrIBftk6SWXbD2UvTidLpr")
	}).startRTM(function (err, bot, payload) {
	  if (err) throw new Error('Could not connect to Slack');
	});
	
	controller.hears(['hello', 'hi'], config, __webpack_require__(3)(controller, d2));
	
	controller.hears(['help', 'how can I use you', 'who is you purpose', 'help me', 'guide'], config, __webpack_require__(5));
	
	controller.hears(['find me(.*)?', 'surprise me'], config, __webpack_require__(6)(d2));
	
	controller.hears(['test'], config, __webpack_require__(8));

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("botkit");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("ticketmaster");

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var data = __webpack_require__(4).hello;
	
	module.exports = function (controller, d2) {
	  return function (bot, message) {
	    bot.api.reactions.add({
	      timestamp: message.ts,
	      channel: message.channel,
	      name: 'robot_face'
	    }, function (err, res) {
	      if (err) {
	        bot.botkit.log('Failed to add emoji reaction :(', err);
	      }
	    });
	
	    controller.storage.users.get(message.user, function (err, user) {
	      if (err) throw new Error(err.message);
	      if (user && user.name) {
	        bot.reply(message, 'Hello ' + user.name + '!');
	        d2.event.all().then(function (events) {
	          // "events" is an array of Ticketmaster event information
	          console.log(events);
	          bot.reply(message, events);
	        });
	      } else {
	        bot.reply(message, data.msg[0]);
	      }
	    });
	  };
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = {
		"hello": {
			"msg": [
				"Hello. How are you?"
			]
		},
		"help": [
			"*Type:*",
			"Find me {keyword}",
			"What on {city}",
			"Events (today|tomorrow,this week|next week)",
			"Give me {classification name}",
			"Surprise me."
		],
		"findMe": {
			"reqUrl": {
				"base": "http://api.page2images.com/restfullink?p2i_size=480x720&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=",
				"sufix": "&p2i_key=887ae1bc9e2f335f"
			},
			"randomOptions": [
				"Sport",
				"Film",
				"Family",
				"Music",
				"Play"
			],
			"conversation": {
				"questions": [],
				"expr": []
			},
			"options": {
				"quantity": 5
			}
		},
		"events": {},
		"whatsOn": {}
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var msg = __webpack_require__(4).help.join('\n\t');
	module.exports = function (bot, message) {
	  bot.reply(message, msg);
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var config = __webpack_require__(4).findMe;
	var requestify = __webpack_require__(7);
	
	// Random search
	function getRandomRes() {
	  return config.randomOptions[~~(Math.random() * 100) % config.randomOptions.length];
	}
	
	// "events" is an array of Ticketmaster event information
	function eventInfo(arr) {
	  var str = '',
	      event,
	      place,
	      startDate;
	
	  for (var i = 0; i < arr.length; i++) {
	    event = arr[i];
	    startDate = event.dates.start;
	    place = event._embedded.venues[0].name ? 'in ' + event._embedded.venues[0].name : '';
	    str = str + ' *' + (i + 1) + '* - ' + event.name + ' ' + place + '\n ' + startDate.localTime + ' ' + startDate.localDate + '\n\n';
	  }
	  return str;
	}
	
	function getAttachemens(event) {
	  "use strict";
	
	  var startDate = event.dates.start;
	
	  return {
	    attachments: [{
	      title: event.name || "",
	      pretext: (event._embedded.venues[0].name || '') + ' ' + startDate.localTime + ' ' + startDate.localDate,
	      text: event.info,
	      mrkdwn_in: ["text", "pretext"],
	      image_url: event.images[0].url
	    }]
	  };
	}
	
	/**
	 * http://api.page2images.com/restfullink?p2i_size=480x720&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=LvZ184t4Qfovi_GmuZZRd&p2i_key=887ae1bc9e2f335f
	 * start a conversation to handle this response.
	 * @param events
	 */
	
	var errorHandler = function errorHandler(err) {
	  bot.reply(message, 'Sorry, no results on your request!');
	};
	
	module.exports = function (d2) {
	  return function (bot, message) {
	    var keyword = message.match[1] && message.match[1].trim(),
	        options = {};
	
	    /**
	     * Random options
	     */
	    if (!keyword) {
	      var option = getRandomRes();
	      options.classificationName = option;
	      bot.reply(message, 'You and your friends usually search for ' + option.toLowerCase() + '.');
	    }
	
	    options.keyword = keyword || '';
	    options.size = config.options.quantity;
	
	    d2.event.all(options).then(function (events) {
	      bot.reply(message, eventInfo(events));
	      bot.startConversation(message, function (err, convo) {
	        convo.ask('Do you need details? Say number or NO.', function (response, convo) {
	          var answer = response.text;
	          convo.say('Cool, you said: ' + answer);
	
	          var n = Number.parseInt(answer, 10);
	
	          if (n && n > 0 && n <= events.length) {
	            (function () {
	              var i = n - 1;
	              var rich = getAttachemens(events[i]);
	              bot.reply(message, rich);
	              bot.startConversation(message, function (err, convo) {
	                convo.ask('Do you need ticket? Say YES or NO.', function (response, convo) {
	                  var answer = response.text;
	                  convo.say('Cool, you said: ' + answer);
	                  if (answer.toLowerCase().match(/(y|yes)/)) {
	
	                    var ticket;
	                    var estimated_need_time = 5;
	
	                    requestify.get([config.reqUrl.base, events[i].id, config.reqUrl.sufix].join('')).then(function (response) {
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
	                        requestify.get([config.reqUrl.base, events[i].id, config.reqUrl.sufix].join('')).then(function (response) {
	                          // Get the response body (JSON parsed or jQuery object for XMLs)
	                          console.log(response.getBody());
	                          var result = JSON.parse(response.getBody());
	                          if (result.image_url) {
	                            ticket = result.image_url;
	                            var rich = {
	                              "attachments": [{
	                                "title": "Your ticket",
	                                "image_url": ticket
	                              }]
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
	            })();
	          }
	
	          convo.next();
	        });
	      });
	    }).catch(errorHandler);
	  };
	};

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = require("requestify");

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function (bot, message) {
	  bot.reply(message, 'http://api.page2images.com/directlink?p2i_size=500x0&p2i_screen=370x600&p2i_url=http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=LvZ184t4Qfovi_GmuZZRd&p2i_key=3ffe4d179f686d6f');
	  //  bot.reply(message, 'http://ticketmaster-api-staging.github.io/products-and-docs/widgets/event-discovery/oldskool/?id=LvZ184t4Qfovi_GmuZZRd');
	  var cm = {
	    "text": "Would you like to play a game?",
	    "attachments": [{
	      "text": "Choose a game to play",
	      "fallback": "You are unable to choose a game",
	      "callback_id": "wopr_game",
	      "color": "#3AA3E3",
	      "attachment_type": "default",
	      "actions": [{
	        "name": "chess",
	        "text": "Chess",
	        "type": "button",
	        "value": "chess"
	      }, {
	        "name": "maze",
	        "text": "Falken's Maze",
	        "type": "button",
	        "value": "maze"
	      }, {
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
	      }]
	    }]
	  };
	  bot.reply(message, cm);
	};

/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map