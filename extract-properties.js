#! /usr/bin/env node

const fs = require("fs");
const xmldom = require("xmldom");

const filename = "single-message-body.html";

function determinePizzaType(itemDescription) {
  console.log(itemDescription);
  return itemDescription.match(/Slice of (\w+) Pizza \(\d+ included\)/)[1];
}

function extractProperties(message) {
  const doc = new xmldom.DOMParser().parseFromString(message.toString(), "text/html");

  const itemDescription = doc.getElementById("eTransReceipt_rConfirm_lineItemsData_lstItems_LineItemControl_0_descriptionLbl_0").textContent;
  const pizzaType = determinePizzaType(itemDescription);

  const quantity = doc.getElementById("eTransReceipt_rConfirm_lineItemsData_lstItems_LineItemControl_0_qtyValue_0").textContent;
  const gradeAndTeacher = doc.getElementById("eTransReceipt_rConfirm_surveyAnswers_lstItems_SurveyAnswerItem_0_SurveyInfoRow_0_InfoValueLabel_0").textContent;
  const total = doc.getElementById("eTransReceipt_rConfirm_subTotalInfoRow_InfoValueLabel").textContent;
  const studentName = doc.getElementById("eTransReceipt_rConfirm_surveyAnswers_lstItems_SurveyAnswerItem_1_SurveyInfoRow_1_InfoValueLabel_1").textContent;
  const email = doc.getElementById("eTransReceipt_paymentResponseViewData_EmailInfoRow_InfoValueLabel").textContent;

  return { studentName, gradeAndTeacher, pizzaType, quantity, email, total };
}

(async () => {
  const contents = await fs.promises.readFile(filename);
  console.log(JSON.stringify(extractProperties(contents.toString()), null, 4));
})();
