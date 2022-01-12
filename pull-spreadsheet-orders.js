#! /usr/bin/env node

const fs = require("fs");

const Papa = require("papaparse");
const { google } = require("googleapis");

const gauth = require("./lib/gauth");
const config = require("./data/config");

function orderData(sheetsData) {
  return sheetsData.valueRanges.flatMap((sheet) => {
    const values = sheet.values;
    const teacher = values[0][0];

    // Row 11 is the first row of student data
    return values.slice(10).map((row) => { return { Name: row[0], "Class": teacher, Type: row[1], Number: row[2] } });
  });
}

(async () => {
  const auth = await gauth();
  const sheets = await google.sheets({version: "v4", auth});
  const sheet = await sheets.spreadsheets.get({
    spreadsheetId: config.sheetId
  });

  const sheetNames = sheet.data.sheets.map((sheet) => sheet.properties.title);
  const classNames = sheetNames.filter((name) => "Totals" !== name);

  const values = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: config.sheetId,
    ranges: classNames
  });

  await fs.promises.writeFile("data/orders-spreadsheet.csv", Papa.unparse(orderData(values.data)));
})();
