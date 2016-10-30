# Alfred the Chatcat


![Alfred the friendly ChatCat](https://raw.githubusercontent.com/georgeganea/haufe_bot/master/chatcat.png)
(source https://dribbble.com/shots/527586-Chatcat)

Alfred is a friendly bot that helps users find seminars or courses in the Haufe Academy.
It's built using the Microsoft Bot Framework https://docs.botframework.com/en-us/node/builder/overview/#navtitle with the Nodejs SDK.
It uses a trained luis.ai application for natural language processing.

Alfred lives in the server.js file and although it (he?) does require some node_modules, the server.js file has just over 200 lines of code. This means that our chat kitteh can, for now, only do one thing: search for courses or seminars. This is how it "thinks": it expects the user to ask from it something like "find courses on leadership". That entire user input it then sends it to his friend luis.ai (more details below) which is a bit smarter and which then returns the detected intent and one or more entities. The intent should always be search because neither Alfred nor luis are trained for anything else. The entities, on the other hand, can be of four types: course topic, course location, course date (the month), and course duration. Having got these results from luis.ai, Alfred does a query to our (mock) database and then three things can happen:
1. no results are found => the conversation starts over, the user can type a new query
2. between one and three results are found => Alfred displays the results and then the user will be able to type in a new query
3. more than three results are found => Alfred displays the number of courses it found that match the given input and then starts asking for entities it did not receive yet. After each answer from the user, Alfred does a new query to the database and displays the results.

This conversation algorithm is written as a waterfall dialog https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall.
Alfred remembers info it receives during the conversation in the session.dialogData object. More info: https://docs.botframework.com/en-us/node/builder/guides/core-concepts/.

Luis, Alfreds friend, is a Microsoft service https://www.luis.ai/Home/About that allows developers to create and train NLP bots (luis.ai apps). Once created and trained we get an endpoint where we can send a line of text and get back the intent and a list of entities.
For the search application we added the "search" intent and the "topic" entity. This is because Microsoft already has entities for location, date and duration. See more info at https://www.luis.ai/Help.

For demo purposes we created the index.html page that displays the bot on top of an iframe that displays the Academy website.

//TODO
- fix the https docker container issue with https://letsencrypt.org/getting-started/ and https://www.duckdns.org/
- include the dockerised bot in the index.html
