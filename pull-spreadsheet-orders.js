#! /usr/bin/env node

const fs = require("fs");

const Papa = require("papaparse");
const { google } = require("googleapis");

const gauth = require("./lib/gauth");
const config = require("./data/config");

const lowerSchoolGrades = [
  "PS",
  "PreK",
  "K",
  "1st",
  "2nd",
  "3rd",
  "4th"
]

const middleSchoolGrades = [
  "5th",
  "6th",
  "7th",
  "8th"
]

function hasAPrefix(str, prefixes) {
  for (const prefix of prefixes) {
    if (str.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function orderData(sheetsData) {
  return sheetsData.valueRanges.flatMap((sheet) => {
    const values = sheet.values;
    const teacher = values[0][0];

    // Row 11 is the first row of student data
    return values.slice(10).map((row) => { return { Name: row[0], "Class": teacher, Type: row[1], Number: row[2] } });
  });
}

function dumpCSV(orderData) {

}

(async () => {
  const auth = await gauth();
  const sheets = await google.sheets({version: "v4", auth});
  const sheet = await sheets.spreadsheets.get({
    spreadsheetId: config.sheetId
  });

  const sheetNames = sheet.data.sheets.map((sheet) => sheet.properties.title);
  const classNames = sheetNames.filter((name) => "Totals" !== name);
  const lowerSchoolNames = classNames.filter((name) => hasAPrefix(name, lowerSchoolGrades));

  const values = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: config.sheetId,
    ranges: classNames
  });

  await fs.promises.writeFile("data/orders-spreadsheet.csv", Papa.unparse(values.data));
})();
