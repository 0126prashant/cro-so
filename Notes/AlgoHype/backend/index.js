
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const sanitize = require("sanitize-filename");

const app = express();
const port = 8080;


app.use(cors())
app.use(express.static("public"));
app.use(express.json());


const capturePageChunks = async (page, folderPath, chunkHeight) => {
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  let yOffset = 0;

  while (yOffset < totalHeight) {
    const chunkPath = path.join(folderPath, `${Date.now()}_${yOffset}.png`);
    await page.screenshot({ path: chunkPath, fullPage: false, clip: { x: 0, y: yOffset, width: 800, height: chunkHeight } });
    yOffset += chunkHeight;
  }
};

app.post("/capture", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send("URL is required");
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil:"domcontentloaded"});

  const chunkHeight = 800; 
   const folderName = sanitize(url);
  const folderPath = path.join(__dirname, "screenshots", folderName);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  await capturePageChunks(page, folderPath, chunkHeight);

  await browser.close();

  res.json({ success: true, folderPath: folderPath.replace(__dirname,"") });
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
