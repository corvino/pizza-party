#! /usr/bin/env node

const fs = require("fs");
const path = require("path");

const Papa = require("papaparse");

const pizza = require("./lib/pizza");

const { classMapping, emailFixes, transactionFixes } = require("./data/config.js");

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
    const body = await pizza.readMessageBody(path.join(messagesPath, message));
    try {
      const order = pizza.extractOrderFromBody(body);
      orders.push(order);
    } catch (error) {
      fs.promises.writeFile(path.join("exceptions", message), body);
      console.log(error);
    }
    // console.log(JSON.stringify(order, null, 4));
  }

  const fixed = orders.map((order) => {
    if (order.transactionId in transactionFixes) {
      return { ...order, ...transactionFixes[order.transactionId]};
    } else if (order.email in emailFixes) {
      return { ...order, ...emailFixes[order.email]}
    }
    return order;
  }).map((order) => {
    return { Name: order.studentName, Class: classMapping[order.gradeAndTeacher], Type: normalizePizzaType(order.pizzaType), Number: order.quantity }
  }).sort((a,b) => {
    const classDifference = classOrder[a.Class] - classOrder[b.Class];
    if (!classDifference) {
      return new Intl.Collator().compare(a.Name, b.Name);
    }
    // console.log(`(${a.Name}, ${b.Name}) - (${a.Class}, ${b.Class}) - (${classOrder[a.Class]}, ${classOrder[b.Class]}) = ${retval}`);
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
