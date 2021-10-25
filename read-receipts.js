#! /usr/bin/env node

const { mboxReader } = require("mbox-reader");
const fs = require("fs");

const file = "data/westside-pizza-receipts.mbox";

function getMessageBody(message) {
  const content = message.content;
  const index = content.indexOf("\n\n");
  return content.slice(index + 1).toString();
}

(async () => {
  const inputStream = fs.createReadStream(file);
  for await (let message of mboxReader(inputStream)) {
    const body = getMessageBody(message);

    process.exit()
  }
})();

// const Mbox = require("node-mbox");

// const mbox = new Mbox(file)

// mbox.on('message', function(msg) {
//   // `msg` is a `Buffer` instance
//   console.log(msg.toString());
//   process.exit()
// });
