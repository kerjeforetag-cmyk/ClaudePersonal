import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

// The spec asks for Chromium + WebKit. Chromium is pre-installed in this
// environment; WebKit's CDN is blocked by the egress policy, so its project is
// added automatically only where the browser is actually present. The suite is
// therefore engine-portable: run it anywhere WebKit exists and it runs there too.
const CHROMIUM = '/opt/pw-browsers/chromium';

function hasWebKit() {
  try {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
    return fs.readdirSync(base).some((d) => d.startsWith('webkit'));
  } catch {
    return false;
  }
}

const projects = [
  {
    name: 'chromium',
    use: {
      viewport: { width: 1280, height: 900 },
      launchOptions: fs.existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {},
    },
  },
];

if (hasWebKit()) {
  projects.push({ name: 'webkit', use: { viewport: { width: 1280, height: 900 } } });
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects,
});
