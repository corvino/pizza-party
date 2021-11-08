#! /usr/bin/env node

const fs = require("fs");
const path = require("path");

const Papa = require("papaparse");

const pizza = require("./lib/pizza");

const { additionalOrders, classMapping, emailFixes, splitOrders, transactionFixes } = require("./data/config.js");

const messagesPath = "messages";

const classOrder = Object.fromEntries(Object.entries(classMapping).map((entry, index) => [entry[1], index]));

function normalizePizzaType(type) {
  if ("Gluten Free Cheese" === type) {
    return "Gluten Free";
  }
  return type;
}

(async () => {
  const orders = [];
  const messages = await fs.promises.readdir(messagesPath);
  for await (message of messages) {
    const { id, body } = await pizza.readMessageBody(path.join(messagesPath, message));
    try {
      const order = pizza.extractOrderFromBody(body);
      orders.push({ ...order, gmailId: id });
    } catch (error) {
      fs.promises.writeFile(path.join("exceptions", message), body);
      console.log(error);
    }
    // console.log(JSON.stringify(order, null, 4));
  }

  const collator = new Intl.Collator();
  const tweakedOrders = orders.map((order) => {
    if (order.transactionId in transactionFixes) {
      return { ...order, ...transactionFixes[order.transactionId]};
    } else if (order.email in emailFixes) {
      return { ...order, ...emailFixes[order.email]}
    }
    return order;
  });
  // console.log(JSON.stringify(splitOrders, null, 4));
  const ordersWithSplits = tweakedOrders.flatMap((order) => {
    if (order.transactionId in splitOrders) {
      return splitOrders[order.transactionId]
    } else {
      return [order];
    }
  });

  const fixed = ordersWithSplits.concat(additionalOrders).map((order) => {
    return { Name: order.studentName, Class: classMapping[order.gradeAndTeacher], Type: normalizePizzaType(order.pizzaType), Number: order.quantity }
  }).sort((a,b) => {
    // console.log(`(${a.Name}, ${b.Name}) - (${a.Class}, ${b.Class}) - (${classOrder[a.Class]}, ${classOrder[b.Class]}) = ${retval}`);

    const classDifference = classOrder[a.Class] - classOrder[b.Class];
    if (!classDifference) {
      const nameComparison = collator.compare(a.Name, b.Name);
      if (!nameComparison) {
        return collator.compare(a.Type, b.Type);
      }
      return nameComparison;
    }
    return classDifference;
  }).reduce((a, b) => {
    if (0 < a.length) {
      const last = a.slice(-1)[0];
      if (last.Name === b.Name && last.Type === b.Type ) {
        last.Number = parseInt(last.Number) + parseInt(b.Number);
        return a;
      }
    }
    return a.concat(b);
  }, []);
//  const output = orders.map((order) => order.gradeAndTeacher);

  console.log(Papa.unparse(fixed));
})();
