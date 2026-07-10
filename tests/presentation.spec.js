// Verification suite for Kasper_Kerje_Resan_Hub.html
// Implements the VERIFIERING checklist from Prompt_Perfektion.md.
// Ten independent checks; each run must pass at least 9 of 10 (>=90%).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.resolve(__dirname, '..', 'Kasper_Kerje_Resan_Hub.html');
const FILE_URL = pathToFileURL(HTML_PATH).href;
const SRC = fs.readFileSync(HTML_PATH, 'utf8');

const countOf = (s, re) => (s.match(re) || []).length;

// Force every reveal element visible and freeze animations so geometry is stable.
async function settleLayout(page) {
  await page.addStyleTag({
    content:
      '*{animation:none!important;transition:none!important}' +
      '.js .rv{opacity:1!important;transform:none!important}',
  });
  await page.evaluate(async () => {
    document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }
  });
  await page.waitForTimeout(120);
}

// Elements whose right edge exceeds the viewport, excluding anything that lives
// inside a horizontally scrollable container (the spec says those don't count).
async function findOverflow(page, tol = 2) {
  return await page.evaluate((tol) => {
    const vw = document.documentElement.clientWidth;
    function insideScrollableX(el) {
      let p = el.parentElement;
      while (p && p !== document.documentElement) {
        const cs = getComputedStyle(p);
        const ox = cs.overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
        p = p.parentElement;
      }
      return false;
    }
    const out = [];
    for (const el of document.body.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + tol) {
        if (insideScrollableX(el)) continue;
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 50),
          right: Math.round(r.right),
          vw,
        });
      }
    }
    return out;
  }, tol);
}

async function overflowAt(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(FILE_URL, { waitUntil: 'load' });
  await settleLayout(page);
  return findOverflow(page);
}

// --- 1. No JavaScript errors -------------------------------------------------
test('1. no JS console errors or page errors', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(FILE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(2600); // let IO, rAF and the 2.2s safety net run
  // exercise every section so all deferred scripts fire
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 20));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  expect(errors, errors.join('\n')).toEqual([]);
});

// --- 2. Tag and brace balance ------------------------------------------------
test('2. HTML tags and CSS braces balance', async () => {
  const pairs = [
    ['style', /<style[ >]/g, /<\/style>/g],
    ['script', /<script[ >]/g, /<\/script>/g],
    ['section', /<section[ >]/g, /<\/section>/g],
    ['svg', /<svg[ >]/g, /<\/svg>/g],
    ['g', /<g[ >]/g, /<\/g>/g],
    ['div', /<div[ >]/g, /<\/div>/g],
    ['canvas', /<canvas[ >]/g, /<\/canvas>/g],
    ['table', /<table[ >]/g, /<\/table>/g],
    ['tr', /<tr[ >]/g, /<\/tr>/g],
    ['p', /<p[ >]/g, /<\/p>/g],
    ['a', /<a[ >]/g, /<\/a>/g],
    ['button', /<button[ >]/g, /<\/button>/g],
  ];
  for (const [name, open, close] of pairs) {
    expect(countOf(SRC, open), `${name} open/close mismatch`).toBe(countOf(SRC, close));
  }
  const css = SRC.slice(SRC.indexOf('<style>') + 7, SRC.indexOf('</style>'));
  expect(countOf(css, /\{/g), 'CSS braces unbalanced').toBe(countOf(css, /\}/g));
});

// --- 3. No en/em dashes ------------------------------------------------------
test('3. no en-dash or em-dash in source or visible text', async ({ page }) => {
  expect(SRC.includes('–'), 'en-dash in source').toBe(false);
  expect(SRC.includes('—'), 'em-dash in source').toBe(false);
  await page.goto(FILE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(2400); // reveal everything
  const text = await page.evaluate(() => document.body.innerText);
  expect(text.includes('–'), 'en-dash in visible text').toBe(false);
  expect(text.includes('—'), 'em-dash in visible text').toBe(false);
});

// --- 4/5/6. No horizontal overflow ------------------------------------------
test('4. no horizontal overflow on desktop (1280)', async ({ page }) => {
  const bad = await overflowAt(page, 1280, 900);
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});

test('5. no horizontal overflow on tablet (768)', async ({ page }) => {
  const bad = await overflowAt(page, 768, 1024);
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});

test('6. no horizontal overflow on mobile (390 and 414); map fits without swipe', async ({ page }) => {
  const bad390 = await overflowAt(page, 390, 844);
  expect(bad390, '390px: ' + JSON.stringify(bad390, null, 2)).toEqual([]);
  const bad414 = await overflowAt(page, 414, 896);
  expect(bad414, '414px: ' + JSON.stringify(bad414, null, 2)).toEqual([]);
  // The expansion map must be fully visible on the smallest phone — no horizontal
  // swipe needed to see the whole animation (explicit requirement).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(FILE_URL, { waitUntil: 'load' });
  await settleLayout(page);
  const map = await page.evaluate(() => {
    const svg = document.getElementById('expmap');
    const scroll = svg.closest('.mapscroll');
    const r = svg.getBoundingClientRect();
    return {
      left: Math.round(r.left),
      right: Math.round(r.right),
      vw: document.documentElement.clientWidth,
      swipe: scroll ? scroll.scrollWidth - scroll.clientWidth : 0,
    };
  });
  expect(map.swipe, 'map still requires a horizontal swipe').toBeLessThanOrEqual(2);
  expect(map.right, 'map extends past the right edge').toBeLessThanOrEqual(map.vw + 2);
  expect(map.left, 'map extends past the left edge').toBeGreaterThanOrEqual(-2);
});

// --- 7. Reveal engine: deep content hidden at load, reveals on scroll --------
test('7. animations do not all fire at once; reveal on scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
  // Read immediately, well before the 2.2s absolute safety net reveals all.
  const atLoad = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.rv')];
    const hub = document.querySelector('#hub h2');
    return {
      total: all.length,
      inCount: all.filter((e) => e.classList.contains('in')).length,
      hubIn: hub ? hub.classList.contains('in') : true,
    };
  });
  expect(atLoad.total).toBeGreaterThan(20);
  expect(atLoad.inCount).toBeGreaterThan(0); // hero has revealed
  expect(atLoad.inCount).toBeLessThan(atLoad.total); // not everything at once
  expect(atLoad.hubIn, 'deep section revealed too early').toBe(false);
  // scrolling the deep section into view reveals it
  await page.evaluate(() => document.querySelector('#hub').scrollIntoView());
  await page.waitForFunction(
    () => document.querySelector('#hub h2').classList.contains('in'),
    null,
    { timeout: 5000 },
  );
});

// --- 8. Map animation gated on scroll ---------------------------------------
test('8. map animation starts only when scrolled into view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
  const playedAtLoad = await page.evaluate(
    () => document.getElementById('expmap').classList.contains('play'),
  );
  expect(playedAtLoad, 'map played before scroll').toBe(false);
  await page.evaluate(() =>
    document.getElementById('expmap').scrollIntoView({ block: 'center' }),
  );
  await page.waitForFunction(
    () => document.getElementById('expmap').classList.contains('play'),
    null,
    { timeout: 5000 },
  );
});

// --- 9. Fonts embedded and page works offline -------------------------------
test('9. fonts embedded, no external requests (offline-safe)', async ({ page }) => {
  const external = [];
  page.on('request', (r) => {
    const u = r.url();
    if (u.startsWith('http://') || u.startsWith('https://')) external.push(u);
  });
  await page.goto(FILE_URL, { waitUntil: 'load' });
  const info = await page.evaluate(async () => {
    try { await document.fonts.ready; } catch {}
    return {
      size: document.fonts.size,
      barlow: document.fonts.check('16px "Barlow"'),
      cond: document.fonts.check('700 16px "Barlow Condensed"'),
    };
  });
  // source: at least six embedded faces, none referencing an external URL
  expect(countOf(SRC, /@font-face/g)).toBeGreaterThanOrEqual(6);
  expect(/src:\s*url\(\s*['"]?https?:/i.test(SRC), 'external font src').toBe(false);
  expect(info.size, 'fonts not loaded').toBeGreaterThanOrEqual(6);
  expect(info.barlow, 'Barlow not available').toBe(true);
  expect(info.cond, 'Barlow Condensed not available').toBe(true);
  expect(external, 'external network requests: ' + external.join(', ')).toEqual([]);
});

// --- 10. Print / PDF: no block or graph split at page breaks -----------------
test('10. print CSS guards blocks and graphs; PDF renders', async ({ page, browserName }) => {
  // The print stylesheet must keep individual blocks and graphics whole.
  expect(SRC).toMatch(/@media print\{[\s\S]*?break-inside:avoid/);
  expect(SRC).toContain('break-inside:avoid;page-break-inside:avoid');
  for (const sel of ['svg', 'canvas', '.card', '.win', '.insikt .i', '.skill', '.mrow']) {
    expect(SRC.includes(sel), 'print guard missing selector ' + sel).toBe(true);
  }
  // Chromium can render the actual PDF the hub's download button produces.
  if (browserName === 'chromium') {
    await page.goto(FILE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.length, 'empty PDF').toBeGreaterThan(2000);
    expect(pdf.slice(0, 5).toString('latin1'), 'not a PDF').toBe('%PDF-');
  }
});
