#! /usr/bin/env node

const fs = require("fs");
const Papa = require("papaparse");

const pizza = require("./lib/pizza");
const { labelClasses } = require("./data/config.js");

const isSpecial = (slices) => {
  const specialNames = ["Gluten Free", "Dairy Free Pepperoni", "Vegan"]

  for (const name of specialNames) {
    if (slices.includes(name)) {
      return true
    }
  }
  return false
}

(async () => {
  const orders = await pizza.parseCSVWithHeader("data/orders-collapsed.csv");

  const subOrders = orders.data.filter(o => labelClasses.includes(o.Class));

  const regularOrders = subOrders.filter(o => !isSpecial(o.Orders))
  const sepcialOrders = subOrders.filter(o => isSpecial(o.Orders))

  const ordersForLabels = sepcialOrders.concat(regularOrders)

  await fs.promises.writeFile("data/orders-labels.csv", Papa.unparse(ordersForLabels));
})();
