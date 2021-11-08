const fs = require("fs");

const xmldom = require("xmldom");

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

function determinePizzaType(itemDescription) {
  return itemDescription.match(/Slice of ([\w ]+) Pizza \(\d+ included\)/)[1];
}

function extractOrderFromBody(message) {
  const doc = new xmldom.DOMParser().parseFromString(message.toString(), "text/html");

  let studentName = null;
  let gradeAndTeacher = null;

  const itemDescription = doc.getElementById("eTransReceipt_rConfirm_lineItemsData_lstItems_LineItemControl_0_descriptionLbl_0").textContent;
  const pizzaType = determinePizzaType(itemDescription);

  const quantity = doc.getElementById("eTransReceipt_rConfirm_lineItemsData_lstItems_LineItemControl_0_qtyValue_0").textContent;
  const total = doc.getElementById("eTransReceipt_rConfirm_subTotalInfoRow_InfoValueLabel").textContent;
  const email = doc.getElementById("eTransReceipt_paymentResponseViewData_EmailInfoRow_InfoValueLabel").textContent;
  const transactionId = doc.getElementById("eTransReceipt_paymentResponseViewData_TransactionIDInfoRow_InfoValueLabel")?.textContent;

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
        throw `Unrecognized survey answer: ${answer}`;
      }
    }
    i++;
  } while (answer)

  return { studentName, gradeAndTeacher, pizzaType, quantity, email, total, transactionId };
}


async function readMessageBody(filepath) {
  const data = await fs.promises.readFile(filepath);
  const message = JSON.parse(data);

  return {
    id: message.id,
    body: Buffer.from(message.payload.body.data, "base64").toString("utf-8")
  };
}

module.exports = {
  extractOrderFromBody,
  readMessageBody
}
