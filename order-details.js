#! /usr/bin/env node

const { mboxReader } = require("mbox-reader");
const fs = require("fs");
const xmldom = require("xmldom");

const file = "data/westside-pizza-receipts.mbox";

function getMessageBody(message) {
  const content = message.content;
  const index = content.indexOf("\n\n");
  return content.slice(index + 1).toString();
}

function determinePizzaType(itemDescription) {
  const match = itemDescription.match(/Slice of ([A-Za-z ]+) Pizza \(\d+ included\)/);
  if (match) {
    return match[1];
  } else {
    console.log("*** Failed to match item description:");
    console.log(itemDescription);
  }
}

function extractSurveyAnswer(doc, item) {
  const name = doc.getElementById(`eTransReceipt_rConfirm_surveyAnswers_lstItems_SurveyAnswerItem_${item}_SurveyInfoRow_${item}_InfoNameLabel_${item}`);
  const value = doc.getElementById
  (`eTransReceipt_rConfirm_surveyAnswers_lstItems_SurveyAnswerItem_${item}_SurveyInfoRow_${item}_InfoValueLabel_${item}`);

  if (name && value) {
    return [name.textContent, value.textContent];
  } else {
    return null;
  }
}

function extractProperties(message) {
  let doc;
  try {
    doc = new xmldom.DOMParser().parseFromString(message.toString(), "text/html");
  } catch (error) {
    console.log("**** Failed to parse message");
    // console.log(message);
    return {};
  }

  let studentName = null;
  let gradeAndTeacher = null;

  const itemDescription = doc.getElementById("eTransReceipt_rConfirm_lineItemsData_lstItems_LineItemControl_0_descriptionLbl_0").textContent;
  const pizzaType = determinePizzaType(itemDescription);

  const quantity = doc.getElementById("eTransReceipt_rConfirm_lineItemsData_lstItems_LineItemControl_0_qtyValue_0").textContent;
  const total = doc.getElementById("eTransReceipt_rConfirm_subTotalInfoRow_InfoValueLabel").textContent;
  const email = doc.getElementById("eTransReceipt_paymentResponseViewData_EmailInfoRow_InfoValueLabel").textContent;

  // const studentName = doc.getElementById("eTransReceipt_rConfirm_surveyAnswers_lstItems_SurveyAnswerItem_1_SurveyInfoRow_1_InfoValueLabel_1").textContent;
  // const gradeAndTeacher = doc.getElementById("eTransReceipt_rConfirm_surveyAnswers_lstItems_SurveyAnswerItem_0_SurveyInfoRow_0_InfoValueLabel_0").textContent;

  let i = 0;
  let answer
  do {
    answer = extractSurveyAnswer(doc, i);
    if (answer) {
      if ("Student Name:" == answer[0]) {
        studentName = answer[1];
      } else if ("Student Grade and Teacher:" == answer[0]) {
        gradeAndTeacher = answer[1];
      } else {
        console.log(answer[0]);
      }
    }
    i++;
  } while (answer)

  return { studentName, gradeAndTeacher, pizzaType, quantity, email, total };
}


(async () => {
  const inputStream = fs.createReadStream(file);
  let orders = [];

  for await (let message of mboxReader(inputStream)) {
    const body = getMessageBody(message);
    const details = extractProperties(body);
    orders.push(details);
  }

  console.log(JSON.stringify(orders, null, 4));
})();

// const Mbox = require("node-mbox");

// const mbox = new Mbox(file)

// mbox.on('message', function(msg) {
//   // `msg` is a `Buffer` instance
//   console.log(msg.toString());
//   process.exit()
// });
