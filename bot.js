const Botkit = require('botkit');
const request = require('superagent');

if(!process.env.token) {
    console.log('Error: Specify a token in an enviornment variable');
    process.exit(1);
}

const controller = Botkit.slackbot();

controller.spawn({
    token:process.env.token
}).startRTM();

controller.on('channel_joined', (bot, message) =>
    bot.say({
        text: `Thank you for inviting me to channel ${message.channel.name}`,
        channel: message.channel.id
       })
    );

controller.hears(['[0-9]+'], ['ambient'], (bot, message) => {
    const number = message.match[0];
    request
       .get(`http://numbersapi.com/${number}`)
       .end((err, res) => {
           if(!err) {
               bot.reply(message, res.text);
           }
       });

});
controller.hears(['trivia'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    bot.startConversation(message, (err, convo) => {
        const askParameter = (response, convoAskParameter, text) => {
            convoAskParameter.ask(text, (response, convoAsk) => {
                convoAsk.say('Ok, let me see...');
                convoAsk.next();
            }, {key: 'number'});
        };
        convo.ask('What kind of random trivia facts would you like to learn? I am intelligent with dates and numbers. You can choose from GENERAL, MATH, or DATE',
        [{
            pattern: 'general',
            callback: (response, convoCallback) => {
                askParameter(response, convoCallback, 'Great, give me either a number or the keyword, random');
                convoCallback.next();
            }
     },
        {
            pattern: 'math',
            callback: (response, convoCallback) => {
                askParameter(response, convoCallback, 'Great, give me either a number or the keyword, random');
                convoCallback.next();
        }
    },
        {
            pattern: 'date',
            callback: (response, convoCallback) => {
                askParameter(response, convoCallback, 'Great, give me either a number or the day of year in the form of month/day (eg. 9/10) or the keyword, random');
                convoCallback.next();
        }
    },
        {
            default: true,
            callback: (response, convoCallback) => {
                convoCallback.repeat();
                convoCallback.next();
        }
    }
        ], {key: 'type'}
        );
        convo.on('end', convoEnd => {
            if(convoEnd.status == 'completed') {
                const type = convoEnd.extractResponse('type').toLowerCase() !== 'general'
                                ? convoEnd.extractResponse('type').toLowerCase()
                                : '';
                const number = convoEnd.extractResponse('number').toLowerCase();

                request
                    .get(`http://numbersapi.com/${number}/${type}`)
                    .end((err, res) => {
                        if(err) {
                            bot.reply(message, 'Sorry, I am unable to process your request');
                        } else {
                            bot.reply(message, res.text);
                        }
                    
                    });

            }
        });
    });
})