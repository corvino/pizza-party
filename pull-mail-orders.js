#! /usr/bin/env node

const fs = require("fs");
const path = require("path");

const { google } = require("googleapis");

const gauth = require("./lib/gauth");

(async () => {
  const auth = await gauth();
  const gmail = await google.gmail({version: "v1", auth});

  const labels = await gmail.users.labels.list({userId: "me"});
  const labelId = labels.data.labels.filter((l) => "westside-pizza-receipts" === l.name )[0].id;
  const emails = await gmail.users.messages.list({userId: "me", labelIds: [labelId], maxResults: 500});
  // console.log(JSON.stringify(emails, null, 4));

  for await (const message of emails.data.messages) {
    const filename = path.join("messages", message.id);
    try {
      await fs.promises.stat(filename);
    } catch(error) {
      console.log(`fetcing ${message.id}`);
      const email = await gmail.users.messages.get({ userId: "me", id: message.id });
      await fs.promises.writeFile(filename, JSON.stringify(email.data, null, 4));
    }
  }
})();
