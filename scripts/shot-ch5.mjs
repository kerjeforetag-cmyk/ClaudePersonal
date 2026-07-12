import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const URL = pathToFileURL(path.resolve('Kasper_Kerje_Resan_Hub.html')).href;
const OUT = 'scratch-shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function cap(name, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelectorAll('.rv').forEach((e) => e.classList.add('in')));
  // bring the demo into view so the fire canvas animates, let it run
  await page.evaluate(() => document.querySelector('.demo').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(3500);
  // screenshot the demo + the block right after it (caption, heading, insikt)
  await page.evaluate(() => window.scrollBy(0, -20));
  await page.screenshot({ path: `${OUT}/${name}-a.png` });
  // then scroll to the insikt cards specifically
  await page.evaluate(() => document.querySelector('.insikt').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}-b.png` });
  await page.close();
  console.log('shot', name);
}

await cap('d-ch5', 1280);
await cap('m-ch5', 390);
await browser.close();
