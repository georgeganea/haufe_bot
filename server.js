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

// configure a link to the luis.ai app
var model = 'https://api.projectoxford.ai/luis/v1/application?id=fb8caa4c-1173-4f53-a6f7-be6ffd88eb83&subscription-key=258332201bbf473fa20a7f216dd45348';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });


//TODO add a map of questions for each question the bot asks so it does not ask the same question over and over

//Alfred is friendly it first says 'hi' and then begins the /search dialog
bot.dialog('/', [
    function (session) {
        session.send("Hi, I\'m Alfred the friendly bot that can help you find information about seminars and courses");
        session.send('You can ask from me stuff like "give me a list of seminars on leadership"');
        session.beginDialog("/search");
      }
]);




var searchForResults = function (session, search, entity, question) {

  var onReturnResult =  function(err, response, body) {
    var i = 0;
    if(err) { console.log(err); return; }

    var results = JSON.parse(body);

    if (results.length == 0) {
          session.send('I could not find any courses');
    }
    else {
      if (results.length >= 1 && results.length <= 3) {

        var msg = "";

        if (results.length == 1)
          msg += 'I found this course for you: \n';
        else
          msg += 'I found these courses for you: \n';

        for (i = 0; i < results.length; i++){
            msg += results[i].coursename + " - " + results[0].url + "\n";
        }

        console.log("message is " + msg);
        session.send(msg);
      }
      else {
        console.log("should search for " + entity.coursetopic)
        //TODO this looks like a bug, coursetopic should not be hardcoded, it should be a variable that matches the question
        if (!entity.coursetopic) {
          builder.Prompts.text(session, "I found " + results.length + " results. Would you like to narrow it down? " + question);
        } else {
          next();
        }
      }
   }

    console.log("Get response: " + response.statusCode);
    console.log(body);
  }
  console.log("searching for results now");
  var url = 'https://sheetlabs.com/HALE/courses';
  request({url:url, qs:search}, onReturnResult);
}

//the /search dialog is configured wit a new builder.IntentDialog({ recognizers: [recognizer] }); which has the luis recognizer
bot.dialog('/search', intents);

intents.onDefault(builder.DialogAction.send("Sorry, I don't understand..."));


//if the luis recognizer detected the search intent, start the warterfall conversation path that should lead to a search result
intents.matches('search', [

    function (session, results, next) {
        //the first step in the waterfall, save everything the user gave us
        console.log (JSON.stringify(results),null,2);
        var topic = builder.EntityRecognizer.findEntity(results.entities, 'topic');
        var location = builder.EntityRecognizer.findEntity(results.entities, 'builtin.geography.city');
        var datetime = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.date');
        var duration = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.duration');

        session.dialogData.search = {
          coursetopic: topic ? topic.entity : undefined,
          courselocation: location ? location.entity : undefined,
          coursemonth: datetime ? new Date(datetime.resolution.date).toLocaleString("en-us", { month: "long" }) : undefined,
          courseduration: duration ? (parseIsoDuration(duration.resolution.duration)/86400000) : undefined,
        }

        //do a search with what we have so far
        //and if we have too many results and if the topic is missing, ask for the topic
        //                                    if the topic is not missing, then just go to the next step and ask the next question
        searchForResults(session, session.dialogData.search, session.dialogData.search, "What is the topic of the course?");

    },

    function (session, results, next) {
      console.log(JSON.stringify(results));
      var search = session.dialogData.search;
      //TODO check that we really get a topic here or that we got a no or maybe the user wants to see the results
      if (results.response) {
         search.coursetopic = results.response;
      }

      searchForResults(session, session.dialogData.search, session.dialogData.search, "Where should the seminar take place?");

    },

    function (session, results, next) {
      console.log(JSON.stringify(results));
      var search = session.dialogData.search;
      //TODO check that we really get a location here
      if (results.response) {
         search.courselocation = results.response;
      }

      searchForResults(session, session.dialogData.search, session.dialogData.search, "When should the seminar take place?");

    },

    function (session, results, next) {
      console.log(JSON.stringify(results));
      var search = session.dialogData.search;
      //TODO check that we really get a location here
      if (results.response && results.entities) {
        var datetime = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.date');
        search.coursemonth = new Date(datetime.resolution.date).toLocaleString("en-us", { month: "long" });
      }

     searchForResults(session, session.dialogData.search, session.dialogData.search, "How long should the course last?");
    },

    function (session,results, results) {
      console.log(JSON.stringify(results));
      var search = session.dialogData.search;
      if (results.response) {
           search.courseduration = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.duration');
      }

       var onReturnResult = function(err, response, body) {

          if (results.length == 0) {
            session.send('I could not find any courses');
          }

          if (results.length >= 1 && results.length <= 3) {

            var msg = "";

            if (results.length == 1)
              msg += 'I found this course for you: \n';
            else
              msg += 'I found these courses for you: \n';

            for (i = 0; i < results.length; i++){
              msg += results[i].coursename + " - " + results[0].url + "\n";
            }

            console.log("message is " + msg);
            session.send(msg);
          }
       }

      searchForResults(session, search, onReturnResult);
      console.log(JSON.stringify(session.dialogData.search));
      session.endDialog();
    }
]);
