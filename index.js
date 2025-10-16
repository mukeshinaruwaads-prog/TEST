const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const express = require('express');
const cors = require('cors');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global browser reuse for efficiency (close on shutdown)
let browser = null;

// Endpoint to get ChatGPT response
app.get('/chat', async (req, res) => {
  const prompt = req.query.prompt || 'hello';  // Default prompt

  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/google-chrome-stable',  // System Chrome on Render
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0');

    // Navigate to ChatGPT
    await page.goto('https://chatgpt.com', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for challenge clearance (stealth handles most)
    await page.waitForTimeout(5000);

    // Skip login for demo (add your session cookies or automate login below)
    // Example login (uncomment & fill creds):
    // await page.fill('input[name="username"]', 'your-email@example.com');
    // await page.click('button[type="submit"]');
    // await page.waitForTimeout(2000);
    // await page.fill('input[name="password"]', 'your-password');
    // await page.click('button[type="submit"]');
    // await page.waitForURL('**/chat**', { waitUntil: 'networkidle' });

    // Send prompt with human-like typing
    const inputSelector = 'textarea[data-id="root"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.focus(inputSelector);
    for (let char of prompt) {
      await page.keyboard.type(char);
      await page.waitForTimeout(50 + Math.random() * 100);
    }
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('[data-message-author-role="assistant"]', { timeout: 30000 });
    const response = await page.evaluate(() => {
      const assistantMsg = document.querySelector('[data-message-author-role="assistant"] .prose');
      return assistantMsg ? assistantMsg.textContent.trim() : 'No response found';
    });

    await page.close();
    res.json({ prompt, response, success: true });
  } catch (error) {
    console.error('Automation error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: error.message, success: false });
  }
});

// Health check
app.get('/', (req, res) => res.send('ChatGPT Automation Ready! Use /chat?prompt=your-message'));

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
