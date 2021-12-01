#! /usr/bin/env node

const fs = require("fs");
const Papa = require("papaparse");

const pizza = require("./lib/pizza");
const { labelClasses } = require("./data/config.js");

(async () => {
  const orders = await pizza.parseCSVWithHeader("data/orders-collapsed.csv");

  const ordersForLabels = orders.data.filter(o => labelClasses.includes(o.Class));

  await fs.promises.writeFile("data/orders-labels.csv", Papa.unparse(ordersForLabels));
})();
