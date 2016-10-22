var builder = require('botbuilder');
var restify = require('restify');
var parseIsoDuration = require('parse-iso-duration');
var request = require('request');

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

var connector = new builder.ChatConnector({
    //do not do this at home kids
    appId: "2e1fe27e-5df2-4283-b457-4789efb1ca2c",
    appPassword: "MznnCcPxnYY6V0yXCLGYB0Q"//TODO hack from the hackaton put this in .env and get it with appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=fb8caa4c-1173-4f53-a6f7-be6ffd88eb83&subscription-key=258332201bbf473fa20a7f216dd45348';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });


// bot.dialog('/', intents);

//TODO add a map of questions for each question the bot asks so it does not ask the same question over and over



bot.dialog('/', [
    function (session) {
        session.send("Hi, I\'m Alfred the friendly bot that can help you find information about seminars and courses");
        session.send('You can ask from me stuff like "give me a list of seminars on Coaching"');
        session.beginDialog("/search");
      }
]);



var searchForResults = function (session, search, callback) {
  var url = 'https://sheetlabs.com/HALE/courses';
  request({url:url, qs:search}, callback);
}

bot.dialog('/search', intents);

intents.onDefault(builder.DialogAction.send("Sorry, I don't understand..."));
// Add intent handlers
intents.matches('search', [

    function (session, results, next) {
        var topic = builder.EntityRecognizer.findEntity(results.entities, 'topic');
        var location = builder.EntityRecognizer.findEntity(results.entities, 'builtin.geography.city');
        var datetime = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.date');
        var duration = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.duration');

        session.dialogData.search = {
          coursetopic: topic ? topic.entity : null,
          courselocation: location ? location.entity : null,
          coursemonth: datetime ? new Date(datetime.resolution.date).toLocaleString("en-us", { month: "long" }) : null,
          courseduration: duration ? (parseIsoDuration(duration.resolution.duration)/86400000) : null,
        }


        var onReturnResult =  function(err, response, body) {

            if(err) { console.log(err); return; }

            var results = JSON.parse(body);

            if (results.length == 0) {
              session.send('I could not find any courses');
            }

            if (results.length >= 1 && results.length <= 3) {
              if (results.length == 1)
                session.send('I found this course for you');
              else
                session.send('I found these courses for you');

              console.log(results[0].coursename)

              session.send(results[0].coursename + " - " + results[0].url);
            }

          console.log("Get response: " + response.statusCode);
          console.log(body);
        }

        searchForResults(session, session.dialogData.search, onReturnResult);
        // Prompt for title
        if (!session.dialogData.search.coursetopic) {
            builder.Prompts.text(session, 'What is the topic of the seminar?');
        } else {
            next();
        }
        //console.log(topic);
    },

    function (session, results, next) {
      console.log(JSON.stringify(results));
      var search = session.dialogData.search;
      //TODO check that we really get a topic here
      if (results.response) {
         search.coursetopic = results.response;
      }

      if (!search.courselocation) {
            builder.Prompts.text(session, 'Where should the seminar take place?');
      } else {
            next();
      }
    },

    function (session, results, next) {
      console.log(JSON.stringify(results));
      var search = session.dialogData.search;
      //TODO check that we really get a location here
      if (results.response) {
         search.courselocation = results.response;
      }

      if (!search.coursemonth) {
            builder.Prompts.text(session, 'When should the seminar take place?');
      } else {
            next();
      }
    },

    function (session, results, next) {
      console.log(JSON.stringify(results));
      var search = session.dialogData.search;
      //TODO check that we really get a location here
      if (results.response && results.entities) {
        var datetime = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.date');
        search.coursemonth = new Date(datetime.resolution.date).toLocaleString("en-us", { month: "long" });
      }

      if (!search.courseduration) {
            builder.Prompts.text(session, 'How long should the course last?');
      } else {
            next();
      }
    },

    function (session,results, results) {
      console.log(JSON.stringify(results));
      var search = session.dialogData.search;
      if (results.response) {
           search.courseduration = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.duration');
      }
      searchForResults(session,search);
      console.log(JSON.stringify(session.dialogData.search));
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
    function (session, results, next) {
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
