#! /usr/bin/env node

const path = require("path");
const pdfmerger = require('pdf-merger-js');
const merger = new pdfmerger();

const { printedTabs } = require("./data/config.js");

const pdfs = printedTabs.map((t) => `${t}.pdf`);

(async () => {
  pdfs.forEach(p => {
    merger.add(path.join("export", p));
  });

  await merger.save("export/all.pdf");
})();
