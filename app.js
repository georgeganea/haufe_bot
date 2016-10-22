var builder = require('botbuilder');
var restify = require('restify');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
// var connector = new builder.ChatConnector({
//     appId: process.env.MICROSOFT_APP_ID,
//     appPassword: process.env.MICROSOFT_APP_PASSWORD
// });

var connector = new builder.ChatConnector({//do not do this at home kids
    appId: "2e1fe27e-5df2-4283-b457-4789efb1ca2c",
    appPassword: "MznnCcPxnYY6V0yXCLGYB0Q"
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=d833bb3f-646b-4efb-849e-e74c4d55818b&subscription-key=258332201bbf473fa20a7f216dd45348';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);


// Add intent handlers
intents.matches('register', [
    function (session, args, next) {
        var subject = builder.EntityRecognizer.findEntity(args.entities, 'subject');
        var product_type = builder.EntityRecognizer.findEntity(args.entities, 'product_type');
        session.dialogData.registration = {
          subject: subject ? subject.entity : null,
          product_type: product_type ? product_type.entity : null
        }
        // Prompt for title
        if (!session.dialogData.registration.subject) {
            builder.Prompts.text(session, 'What is the subject?');
        } else {
            next();
        }
        //console.log(subject);
        //session.endDialog();
    },

    function (session, results, next) {
      var registration = session.dialogData.registration;
      if (results.response) {
         registration.subject = results.response;
      }

      if (registration.subject && !registration.product_type) {
            builder.Prompts.text(session, 'Would you like to book a seminar or a conference?');
      } else {
            next();
      }
    },

    function (session,results, results) {
      var registration = session.dialogData.registration;
      if (results.response) {
           registration.product_type = builder.EntityRecognizer.findEntity(results.entities, 'product_type');
      }
      session.send('registration data is now ' + registration.product_type + " " + registration.subject );
      session.send('we can now register for a new seminar or conference');
      session.endDialog();
    }
]);


/*
intents.matches(/^change name/i, [
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
    }
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);
*/
