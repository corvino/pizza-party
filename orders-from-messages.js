#! /usr/bin/env node

const fs = require("fs");
const path = require("path");

const Papa = require("papaparse");

const pizza = require("./lib/pizza");

const { additionalOrders, classMapping, idFixes, idSplits, splitOrders, transactionFixes } = require("./data/config.js");

const messagesPath = "messages";

const classOrder = Object.fromEntries(Object.entries(classMapping).map((entry, index) => [entry[1], index]));

const collator = new Intl.Collator();

function classComparator(a, b) {
  const classDifference = classOrder[a.Class] - classOrder[b.Class];
  if (!isNaN(classDifference) && classDifference) {
    return classDifference
  } else if (a.Class in classOrder && b.Class in classOrder) {
    // Treat these as equal, so fall through and continute.
  } else if (a.Class in classOrder) {
    return 1;
  } else if (b.Class in classOrder) {
    return -1;
  }

  const nameComparison = collator.compare(a.Name, b.Name);
  if (nameComparison) {
    return nameComparison;
  }

  return collator.compare(a.Type, b.Type);
}

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
  }

  const tweakedOrders = orders.map((order) => {
    if (order.gmailId in idFixes) {
      return { ...order, ...idFixes[order.gmailId] };
    } else if (order.transactionId in transactionFixes) {
      return { ...order, ...transactionFixes[order.transactionId] };
    }
    return order;
  });

  const ordersWithSplits = tweakedOrders.flatMap((order) => {
    if (order.gmailId in idSplits) {
      return idSplits[order.gmailId];
    } else if (order.transactionId in splitOrders) {
      return splitOrders[order.transactionId];
    } else {
      return [order];
    }
  });

  const augmentedOrders = ordersWithSplits.concat(additionalOrders);

  const expandedOrders = augmentedOrders.flatMap(order => {
    return order.items.map(item => {
      const { items, ...newOrder } = { ...order, pizzaType: item.type, quantity: item.quantity };
      return newOrder;
    });
  });

  const remappedOrders = expandedOrders.map((order) => {
    return { Name: order.studentName, Class: classMapping[order.gradeAndTeacher], Type: normalizePizzaType(order.pizzaType), Number: order.quantity }
  })

  const sortedOrders = remappedOrders.sort(classComparator);
  const compactedOrders = sortedOrders.reduce((a, b) => {
    if (0 < a.length) {
      const last = a.slice(-1)[0];
      if (last.Name === b.Name && last.Type === b.Type ) {
        last.Number = parseInt(last.Number) + parseInt(b.Number);
        return a;
      }
    }
    return a.concat(b);
  }, []);

  console.log(Papa.unparse(compactedOrders));
})();
