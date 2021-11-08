#! /usr/bin/env node

const process = require("process");
const pizza = require("./lib/pizza");

if (3 !== process.argv.length) {
  console.log("usage: extract-gmail-order.js <filepath>");
  process.exit(1);
}
const filepath = process.argv[2];

(async () => {
  const { body } = await pizza.readMessageBody(filepath);
  console.log(body);
})();
