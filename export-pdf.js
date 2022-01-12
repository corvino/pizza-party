#! /usr/bin/env node

const path = require("path");
const fs = require("fs");
const axios = require("axios");

const { google } = require("googleapis");

const gauth = require("./lib/gauth");
const config = require("./data/config");

const EXPORT_PATH="export";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function exportDrive() {
  const drive = await google.drive({version: 'v3', auth});
  const response = await drive.files.export(
    { fileId: sheetId, mimeType: "application/pdf" },
    { responseType: "arraybuffer"});

  await fs.promises.writeFile("tmp-drive-api.pdf", Buffer.from(response.data), "binary");
}

async function exportTab(token, sheetId, tab) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?gid=${tab.id}&format=pdf&horizontal_alignment=CENTER&r1=0&c1=0&r2=1000&c2=3`;

  try {
    const response = await axios({
      method: "get",
      url: url,
      headers: {
        "Authorization": `Bearer ${token}`
      },
      responseType: "arraybuffer"
    });

    return response.data;
  } catch (error) {
    throw `Error exporting sheet ${tab.title}; status: ${error.response.status}; statusText: ${error.response.statusText}`;
  }
}

async function exportTabToFile(token, sheetId, tab) {
  const data = await exportTab(token, sheetId, tab);

  const filepath = path.join(EXPORT_PATH, `${tab.title}.pdf`);
  console.log(`${tab.title} exported to ${filepath}`);
  await fs.promises.writeFile(filepath, Buffer.from(data), "binary");
}

// Attempt task retries times, with a progressively increasing
// wait between attempts.
async function doWithRetries(task, waits) {
  for (wait of waits) {
    try {
      await task();
      break;
    } catch (error) {
      console.log(error);
      console.log(`sleeping ${wait} before retry`);
      await sleep(wait * 1000);
    }
  }
}

(async () => {
  try {
    const auth = await gauth();
    const sheets = await google.sheets({version: "v4", auth});
    const sheet = await sheets.spreadsheets.get({
      spreadsheetId: config.sheetId
    });

    const tabs = sheet.data.sheets.map(s => { return { id: s.properties.sheetId, title: s.properties.title } });
    const printed = tabs.filter(t => config.printedTabs.includes(t.title));

    const accessToken = await auth.getAccessToken();

    await fs.promises.mkdir(EXPORT_PATH, { recursive: true });

    for (tab of printed) {
        await doWithRetries(async () => { await exportTabToFile(accessToken.token, config.sheetId, tab) }, [4, 10, 30, 60]);
        await sleep(0*1000);
    }
  } catch (error) {
    console.log(error);
  }
})();
