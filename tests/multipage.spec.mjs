/**
 * Pagination check: what happens when a CV is longer than one sheet.
 *
 *   node tests/multipage.spec.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = pathToFileURL(path.join(ROOT, 'index.html')).href + '#/edit';
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'cv-studio-'));
const pdfPages = (f) => {
  const d = fs.readFileSync(f).toString('latin1');
  return d.split('/Type /Page').length - d.split('/Type /Pages').length;
};

const failures = [];
function check(name, actual, expected) {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}: ${JSON.stringify(actual)}`);
  if (!ok) failures.push(name);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(APP);
await page.waitForTimeout(700);

/* a one column template needs two sheets for this much content */
await page.locator('.tab[data-tab="templates"]').click();
await page.locator('.tpl[data-tpl="executive"]').click();
await page.waitForTimeout(500);
check('two sheets on screen', await page.locator('#pages .page').count(), 2);
check('the banner is not repeated on sheet two', await page.locator('#pages .page').nth(1).locator('.banner').count(), 0);

const a = path.join(TMP, 'exec.pdf');
await page.pdf({ path: a, format: 'A4', printBackground: false });
check('two sheets in the pdf', pdfPages(a), 2);

/* a long job carries its last bullets over rather than leaving a gap */
await page.locator('.tpl[data-tpl="minimalist"]').click();
await page.waitForTimeout(600);
const gap = await page.evaluate(() => {
  const col = document.querySelector('#pages .page .col.main');
  const last = col.lastElementChild;
  return Math.round(col.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom);
});
check('sheet one is filled, not left half empty', gap, (g) => g < 140);

/* a sidebar template keeps its sidebar artwork on later sheets */
await page.locator('.tpl[data-tpl="modern"]').click();
await page.waitForTimeout(400);
await page.locator('.tab[data-tab="design"]').click();
const slider = page.locator('input[data-var="--fs-body"]');
await slider.fill('15');
await slider.dispatchEvent('input');
await page.waitForTimeout(800);
check('sidebar art is drawn on sheet two', await page.locator('#pages .page').nth(1).locator('.art > *').count(), (n) => n >= 1);

/* typing while the cv spans two sheets keeps the words and the caret */
await page.locator('#pages .body-text').first().click();
await page.keyboard.type('Typed while paginating. ');
await page.waitForTimeout(900);
check('typed text lands', await page.locator('#pages .body-text').first().innerText(), (t) => t.includes('Typed while paginating.'));
check('caret stays in the same field', await page.evaluate(() => document.activeElement.className), 'body-text');

check('no browser errors', errors, (e) => e.length === 0);

await browser.close();
fs.rmSync(TMP, { recursive: true, force: true });
console.log(failures.length ? `\n${failures.length} check(s) failed: ${failures.join(', ')}` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
