#! /usr/bin/env node

const fs = require("fs");
const path = require("path");
const pizza = require("./lib/pizza");

const messagesPath = "messages";
const bodyPath = "message-bodies";

(async () => {
  const messages = await fs.promises.readdir(messagesPath);
  for await (message of messages) {
    const { id, body } = await pizza.readMessageBody(path.join(messagesPath, message));
    await fs.promises.writeFile(path.join(bodyPath, `${message}.html`), body);
  }
})();
