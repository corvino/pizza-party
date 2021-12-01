#! /usr/bin/env node

const fs = require("fs");
const Papa = require("papaparse");

const pizza = require("./lib/pizza");

(async () => {
  const orders = await pizza.parseCSVWithHeader("data/orders-spreadsheet.csv");

  const mappedOrders = orders.data.map((o) => {
    return { Name: o.Name, Class: o.Class, Orders: [{Type: o.Type, Number: o.Number, }] };
  });

  const collapsedOrders = mappedOrders.reduce((a, b) => {
    if (0 === a.length) {
      return a.concat(b);
    } else {
      // console.log(`names: ${a.slice(-1)[0].Name} - ${b.Name}`);
      if (a.slice(-1)[0].Name !== b.Name) {
        return a.concat(b);
      } else {
        const old = a.slice(-1)[0];
        old.Orders = old.Orders.concat(b.Orders);
        return a;
      }
    }
  }, []);

  const ordersForLabels = collapsedOrders.map(o => {
    return { ...o, Orders: o.Orders.map(o => `${o.Number} x ${o.Type}`).join(", ")};
  });

  await fs.promises.writeFile("data/orders-collapsed.csv", Papa.unparse(ordersForLabels));
})();
