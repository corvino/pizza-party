const fs = require("fs");

const Papa = require("papaparse");
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

function extractSurveyAnswers(doc) {
  const answers = {};

  for (let i = 0; true; i++) {
    answer = extractSurveyAnswer(doc, i);
    if (answer) {
      if ("Student Name:" == answer[0]) {
        answers.studentName = answer[1];
      } else if ("Student Grade and Teacher:" == answer[0]) {
        answers.gradeAndTeacher = answer[1];
      } else {
        throw `Unrecognized survey answer: ${answer}`;
      }
    } else {
      break;
    }
  }

  return answers;
}

function extractOrderItem(doc, item) {
  const itemDescription = doc.getElementById(`eTransReceipt_rConfirm_lineItemsData_lstItems_LineItemControl_${item}_descriptionLbl_${item}`);
  const quantity = doc.getElementById(`eTransReceipt_rConfirm_lineItemsData_lstItems_LineItemControl_${item}_qtyValue_${item}`);

  if (itemDescription && quantity) {
    return { type: determinePizzaType(itemDescription.textContent), quantity: quantity.textContent };
  } else {
    return null;
  }
}

function extractOrderItems(doc) {
  const items = [];

  for (let i = 0; true; i++) {
    const item = extractOrderItem(doc, i);
    if (item) {
      items.push(item);
    } else {
      break;
    }
  }

  return items;
}

function determinePizzaType(itemDescription) {
  return itemDescription.match(/Slice of ([\w ]+) Pizza \(\d+ included\)/)[1];
}

function extractOrderFromBody(message) {
  const doc = new xmldom.DOMParser().parseFromString(message.toString(), "text/html");

  const total = doc.getElementById("eTransReceipt_rConfirm_subTotalInfoRow_InfoValueLabel").textContent;
  const email = doc.getElementById("eTransReceipt_paymentResponseViewData_EmailInfoRow_InfoValueLabel").textContent;
  const transactionId = doc.getElementById("eTransReceipt_paymentResponseViewData_TransactionIDInfoRow_InfoValueLabel")?.textContent;

  const items = extractOrderItems(doc);
  const { studentName, gradeAndTeacher } = extractSurveyAnswers(doc);

  return { studentName, gradeAndTeacher, items, email, total, transactionId };
}

async function readMessageBody(filepath) {
  const data = await fs.promises.readFile(filepath);
  const message = JSON.parse(data);

  return {
    id: message.id,
    body: Buffer.from(message.payload.body.data, "base64").toString("utf-8")
  };
}

async function parseCSVWithHeader(file) {
  return await parseCSV(fs.createReadStream(file), { header: true, dynamicTyping: true });
}

async function parseCSV(rawFile, config) {
  const parseFile = rawFile => {
    return new Promise(resolve => {
      const configWithComplete = {
        ...config,
        complete: results => {
          resolve(results);
        }
      }

      Papa.parse(rawFile, configWithComplete);
    });
  };
  return await parseFile(rawFile);
}

module.exports = {
  extractOrderFromBody,
  parseCSVWithHeader,
  readMessageBody
}
