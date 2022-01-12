const fs = require("fs");
const readline = require("readline");
const { spawn } = require('child_process');

const { google } = require("googleapis");

const TOKEN_PATH = "data/tokens.json";

async function authorize() {
  const credentials = JSON.parse(await fs.promises.readFile("data/credentials.json"));

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      console.log(`Wrote refresh token to ${TOKEN_PATH}`);
      await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
    }
  });

  const token = await (async () => {
    try {
      const token = JSON.parse(await fs.promises.readFile(TOKEN_PATH));
      if (new Date(token.expiry_date) < new Date()) {
        // Token is expired, so get a new one.
        return await getNewToken(oauth2Client);
      } else {
        return token;
      }
    } catch(error) {
      console.log(error);
      return await getNewToken(oauth2Client);
    }
  })();
  oauth2Client.credentials = { refresh_token: token.refresh_token };
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
  if ("darwin" === process.platform) {
    // Consider https://github.com/sindresorhus/open for cross-platform support.
    spawn("open", [authUrl]);
  }
  const rl = await readline.promises.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const code = await rl.question("Enter the code from that page here: ");
  rl.close();
  const token = await oauth2Client.getToken(code);
  return token;
}

module.exports = authorize;
