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