#! /usr/bin/env node

const fs = require("fs");
const Papa = require("papaparse");

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

function dumpCSV(data) {
  console.log(Papa.unparse(data));
}

(async () => {
  const orders = await parseCSVWithHeader("data/all-orders.csv");

  const kids = orders.data.reduce((a, b) => {
    if (0 === a.length) {
      return a.concat(b);
    } else {
      // console.log(`names: ${a.slice(-1)[0].Name} - ${b.Name}`);
      if (a.slice(-1)[0].Name !== b.Name) {
        return a.concat(b);
      } else {
        const old = a.slice(-1)[0];
        old.Type = [old.Type, b.Type];
        old.Number = [old.Number, b.Number];
        // old.Type = old.Type + "," + b.Type;
        // old.Number = old.Number + "," + b.Number;
        return a;
      }
    }
  }, []);

  dumpCSV(kids);

  //console.log(JSON.stringify(kids, null, 4));
})();
