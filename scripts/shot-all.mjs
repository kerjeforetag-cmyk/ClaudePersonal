import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const URL = pathToFileURL(path.resolve('Kasper_Kerje_Resan_Hub.html')).href;
const OUT = 'scratch-shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const views = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  await page.goto(URL, { waitUntil: 'load' });
  // reveal everything and trigger scroll-based animations
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    document.querySelectorAll('.rv').forEach((e) => e.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/full-${v.name}.png`, fullPage: true });
  await page.close();
  console.log('shot', v.name, v.width);
}
await browser.close();
