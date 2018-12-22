// Dependencies
// ===========================================================
var express = require("express");
var path = require("path");
const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');
const html2plaintext = require('html2plaintext');

var app = express();
app.use(express.static('app/public'))

var PORT = process.env.PORT || 8080;

// read and verify the credentials
var rawData = fs.readFileSync('oauth2.keys.json');
var credentials = JSON.parse(rawData);

const { client_secret, client_id, redirect_uris } = credentials.web;
console.log(client_id);
console.log(client_secret);
console.log(redirect_uris[0]);

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const USER_ID = "store5622";
const TOKEN_PATH = USER_ID + "_" + "token.json";


authorize();
var oAuth2Client;

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize() {
  oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
    //listLabels(oAuth2Client);
    readMessages(1, oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  /* const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  }); */
}


/**
* Lists the labels in the user's account.
*
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
*/
function listLabels(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.labels.list({
    userId: 'store5622@gmail.com',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}



/*
** read n number of messages from a given labelId
*/
function readMessages(max_msgs_to_read, auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.messages.list({
    userId: 'store5622@gmail.com',
    labelIds: 'INBOX',
    maxResults: max_msgs_to_read
  }, (err, res) => {
    if (err) return console.log('The API gmail.users.messages.list returned an error: ' + err);
    const messages = res.data.messages;
    if (messages.length) {
      console.log(messages);
      messages.forEach((message) => {
        gmail.users.messages.get({
          //  userId: 'me',
          userId: 'store5622@gmail.com',
          id: message.id,
        }, (err, res) => {
          if (err) return console.log('The API gmail.users.messages.get returned an error: ' + err);
          console.log(res.data.payload.body.data);
          // console.log("================");
          // console.log('res.data.id:');
          // console.log("================")
          // console.log(`- ${res.data.id}`);
          
          // console.log("================");          
          // console.log('res.data.snippet:');
          // console.log("================")
          // console.log(`Snippet: ${res.data.snippet}`);

          // console.log("================");          
          // console.log('res.data.payload.headers:');
          // console.log("================")
          // console.log(res.data.payload.headers);

          // // console.log(res.data.payload.parts.length);
          
          // console.log("================");          
          // console.log('res.data.payload.parts:');
          // console.log("================")
        //    console.log(res.data.payload.parts);


          console.log("================");          
          console.log('res.data.payload.parts.body.data:');
          console.log("================")
          let encodedData = res.data.payload.body.data;
          let buff = Buffer.from(encodedData, 'base64');  
          let text = buff.toString('ascii');

          console.log(html2plaintext(text));
         });
      });
    } else {
      console.log('No Messages  found.');
    }

  });

}

// Routes
// ===========================================================
app.get("/", function (req, res) {
  var fullPath = path.join(__dirname, "app/public/home.html");


  //console.log(fullPath);
  res.sendFile(fullPath);
});

app.get("/:oauth2callback", function (req, res) {
  var thisquery = req.query;

  var code = thisquery.code

  if (req.params.oauth2callback === "oauth2callback") {
    console.log(req.params)
    console.log(req.query);
    // console.log("thisquery =" + thisquery);
    console.log("code =" + code);
    // console.log("thisquery[code] = " + thisquery['code']);
    // var myreq = JSON.stringify(req);

    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      //listLabels(oAuth2Client);
      readMessages(1, oAuth2Client);

    });
  }

  // What does this log?

  //console.log(req.baseUrl);
  //console.log(req.method)

  //var msg;

  //console.info(msg, req);
  res.end();
});


// Listener
// ===========================================================
app.listen(PORT, function () {
  console.log("App listening on PORT " + PORT);
});
