#! /usr/bin/env node

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
  return sheetsData.valueRanges.map((sheet) => {
    const values = sheet.values;
    const teacher = values[0][0];

    // Row 11 is the first row of student data
    return values.slice(10).map((row) => [row[0], teacher, row[1], row[2]]);
  }).flat();
}

function dumpCSV(orderData) {
  console.log("Name,Class,Type,Number");
  console.log(Papa.unparse(orderData));
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

  dumpCSV(orderData(values.data));

  // console.log(`The title of the documents is: ${sheet.data.properties.title}`);

  // console.log(`sheet names: ${JSON.stringify(sheetNames, null, 4)}`);
  // console.log(`class names: ${JSON.stringify(classNames, null, 4)}`);
  // console.log(`lower school names: ${JSON.stringify(lowerSchoolNames, null, 4)}`);

  // console.log(`${JSON.stringify(sheet.data, null, 4)}`);

  // console.log(JSON.stringify(values.data, null, 4));

  //console.log(JSON.stringify(csv, null, 4));
})();
