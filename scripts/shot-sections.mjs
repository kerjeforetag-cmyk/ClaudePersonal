import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const URL = pathToFileURL(path.resolve('Kasper_Kerje_Resan_Hub.html')).href;
const OUT = 'scratch-shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const width = Number(process.argv[2] || 820);
const tag = process.argv[3] || 'tab';
const anchors = [
  ['hero', 'header.hero'],
  ['prog', '.prog'],
  ['wins', '.wins'],
  ['map', '.mapsec .mapbox'],
  ['meddic', '.mlist'],
  ['stats', '.mstats'],
  ['ladder', '.ladder'],
  ['skills', '.skills'],
  ['match', '.mtable'],
  ['hub', '.hub .cards'],
];

const page = await browser.newPage({ viewport: { width, height: Math.round(width * 1.5) } });
await page.goto(URL, { waitUntil: 'load' });
await page.evaluate(() => document.querySelectorAll('.rv').forEach((e) => e.classList.add('in')));
for (const [name, sel] of anchors) {
  const el = page.locator(sel).first();
  if (await el.count()) {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png` });
  }
}
await browser.close();
console.log('done', width, tag);
