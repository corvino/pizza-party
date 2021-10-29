const fs = require("fs");
const readline = require("readline");

const { google } = require("googleapis");

const TOKEN_PATH = "data/token.json";

async function authorize() {
  const credentials = JSON.parse(await fs.promises.readFile("data/credentials.json"));

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  const token = await (async () => {
    try {
      return JSON.parse(await fs.promises.readFile(TOKEN_PATH));
    } catch(error) {
      return await getNewToken(oauth2Client);
    }
  })();
  oauth2Client.credentials = { refresh_token: token.tokens.refresh_token };
  return oauth2Client;
}

async function getNewToken(oauth2Client) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/drive.readonly"],
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = await readline.promises.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const code = await rl.question("Enter the code from that page here: ");
  rl.close();
  const token = await oauth2Client.getToken(code);
  await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token));
  return token;
}

module.exports = authorize;
