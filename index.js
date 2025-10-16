const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const express = require('express');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 10000;

app.get('/', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: 'new',  // Use new headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://chatgpt.com');
  // Add your automation logic here (e.g., login, send prompt)
  const title = await page.title();
  await browser.close();
  res.send(`<h1>Stealth Test on Render: ${title}</h1>`);
});

app.listen(port, () => console.log(`Server on port ${port}`));
