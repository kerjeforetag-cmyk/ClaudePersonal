#!/usr/bin/env node
// Runs the Playwright verification suite ten times in a row.
// Each run must score at least 9 of 10 (>=90%), per Prompt_Perfektion.md.
// Exits non-zero if any of the ten runs falls below the threshold.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RESULTS = path.join(ROOT, 'test-results', 'results.json');
const RUNS = 10;
const THRESHOLD = 0.9;

function runOnce() {
  try { fs.rmSync(RESULTS, { force: true }); } catch {}
  // Use the reporters from playwright.config.js (json -> test-results/results.json).
  const res = spawnSync('npx', ['playwright', 'test'], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'ignore'],
    env: process.env,
  });
  const report = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
  const s = report.stats || {};
  const passed = (s.expected || 0) + (s.flaky || 0);
  const failed = s.unexpected || 0;
  const total = passed + failed;
  return { passed, failed, total, code: res.status };
}

const rows = [];
let allOk = true;

for (let i = 1; i <= RUNS; i++) {
  const r = runOnce();
  const rate = r.total ? r.passed / r.total : 0;
  const ok = rate >= THRESHOLD;
  if (!ok) allOk = false;
  rows.push({ run: i, ...r, rate });
  console.log(
    `Run ${String(i).padStart(2)}/10 : ${r.passed}/${r.total} passed ` +
      `(${(rate * 100).toFixed(0)}%) ${ok ? 'OK' : 'BELOW 90%'}`,
  );
}

console.log('\n================ SUMMARY ================');
for (const r of rows) {
  console.log(
    `  Run ${String(r.run).padStart(2)} : ${r.passed}/${r.total} (${(r.rate * 100).toFixed(0)}%)`,
  );
}
const minRate = Math.min(...rows.map((r) => r.rate));
console.log('========================================');
console.log(
  `Lowest run: ${(minRate * 100).toFixed(0)}%  |  Threshold: 90%  |  ` +
    `Result: ${allOk ? 'PASS — 10/10 runs met 90%' : 'FAIL'}`,
);

process.exit(allOk ? 0 : 1);
