import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const URL = pathToFileURL(path.resolve('Kasper_Kerje_Resan_Hub.html')).href;
const OUT = 'scratch-shots';
import fs from 'node:fs';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function shot(name, { width, height, sel, full }) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelectorAll('.rv').forEach((e) => e.classList.add('in')));
  await page.waitForTimeout(700);
  if (sel) {
    // reveal map/tri animations by scrolling the element into view
    await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView(); }, sel);
    await page.waitForTimeout(1200);
    const el = page.locator(sel).first();
    await el.screenshot({ path: `${OUT}/${name}.png` });
  } else {
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full || false });
  }
  await page.close();
  console.log('shot', name);
}

// Desktop
await shot('d-hero', { width: 1280, height: 900, sel: 'header.hero' });
await shot('d-prog', { width: 1280, height: 900, sel: 'section.alt:has(.prog)' });
await shot('d-map', { width: 1280, height: 900, sel: '.mapsec' });
// Mobile
await shot('m-hero', { width: 390, height: 844, sel: 'header.hero' });
await shot('m-prog', { width: 390, height: 844, sel: 'section.alt:has(.prog)' });
await shot('m-map', { width: 390, height: 844, sel: '.mapsec' });
await shot('m-kand', { width: 390, height: 844, sel: 'section.hub' });

await browser.close();
