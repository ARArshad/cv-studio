/**
 * End to end check of the whole editor in a real browser.
 *
 *   npm install
 *   npx playwright install chromium
 *   npm test
 *
 * Every number it prints is asserted, so a failure exits non zero and says
 * which check went wrong.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = pathToFileURL(path.join(ROOT, 'index.html')).href;
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
const ctx = await browser.newContext({ viewport: { width: 1560, height: 1120 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(APP);
await page.waitForTimeout(700);

check('starts on one page', await page.locator('#pages .page').count(), 1);
check('classic template is selected', await page.locator('.tpl.on').innerText(), (t) => t.includes('Classic'));

/* editing */
await page.locator('.ident .nm').click();
await page.keyboard.press('Meta+A');
await page.keyboard.type('Test Person');
await page.waitForTimeout(700);
check('name can be edited', await page.locator('.ident .nm').innerText(), 'Test Person');

/* every template renders and keeps the content */
await page.locator('.tab[data-tab="templates"]').click();
const ids = await page.locator('.tpl').evaluateAll((els) => els.map((e) => e.getAttribute('data-tpl')));
check('ten templates offered', ids.length, 10);
for (const id of ids) {
  await page.locator(`.tpl[data-tpl="${id}"]`).click();
  await page.waitForTimeout(400);
  const kept = await page.locator('#pages').innerText();
  check(`${id} keeps the content`, kept.includes('Site Electrician'), true);
}
await page.locator('.tpl[data-tpl="classic"]').click();
await page.waitForTimeout(400);

/* colours */
await page.locator('.tab[data-tab="design"]').click();
await page.locator('.scheme').nth(6).click();
await page.waitForTimeout(250);
check('colour scheme applies', await page.locator('#pages .page').first().evaluate((e) => getComputedStyle(e).getPropertyValue('--brand').trim()), '#6f2630');
await page.locator('.scheme').nth(0).click();

/* sections */
await page.locator('.tab[data-tab="sections"]').click();
const rows = await page.locator('.secrow').count();
await page.locator('.secrow').nth(3).locator('button[data-a="show"]').click();
await page.waitForTimeout(350);
check('a hidden section leaves the page', await page.locator('#pages .h-sec', { hasText: 'Achievements' }).count(), 0);
await page.locator('.secrow').nth(3).locator('button[data-a="show"]').click();
await page.waitForTimeout(300);
await page.locator('#addmenu button', { hasText: 'Certificates' }).click();
await page.waitForTimeout(400);
check('a section can be added', await page.locator('.secrow').count(), rows + 1);

/* phrases */
await page.locator('.tab[data-tab="phrases"]').click();
await page.selectOption('#phraseCat', 'Electrical');
await page.locator('#pages ul.pts li [contenteditable]').first().click();
const before = await page.locator('#pages ul.pts li').count();
await page.locator('.phrase').first().click();
await page.waitForTimeout(500);
check('a phrase drops into the bullet list', (await page.locator('#pages ul.pts li').count()) - before, 1);

/* undo and redo */
await page.locator('#btnUndo').click();
await page.waitForTimeout(400);
check('undo takes it back', await page.locator('#pages ul.pts li').count(), before);
await page.locator('#btnRedo').click();
await page.waitForTimeout(400);
check('redo puts it back', await page.locator('#pages ul.pts li').count(), before + 1);

/* checks tab */
await page.locator('.tab[data-tab="checks"]').click();
await page.waitForTimeout(400);
check('the check list reports', await page.locator('.check').count(), (n) => n >= 8);

/* overflow and fit */
await page.locator('.tab[data-tab="design"]').click();
const fs_ = page.locator('input[data-var="--fs-body"]');
await fs_.fill('15');
await fs_.dispatchEvent('input');
await page.waitForTimeout(700);
check('big text spills onto a second page', await page.locator('#pages .page').count(), 2);
await page.locator('#btnFit').click();
await page.waitForTimeout(1200);
check('fit pulls it back to one page', await page.locator('#pages .page').count(), 1);

/* printing, with background graphics switched off */
const pdf = path.join(TMP, 'out.pdf');
await page.pdf({ path: pdf, format: 'A4', printBackground: false });
check('prints one A4 page without background graphics', pdfPages(pdf), 1);

/* exports */
const [htmlDl] = await Promise.all([page.waitForEvent('download'), page.locator('#btnHtml').click()]);
const exported = path.join(TMP, 'export.html');
await htmlDl.saveAs(exported);
const p2 = await ctx.newPage();
await p2.goto(pathToFileURL(exported).href);
await p2.waitForTimeout(400);
check('exported html has no editing left in it', await p2.locator('[contenteditable]').count(), 0);
const pdf2 = path.join(TMP, 'export.pdf');
await p2.pdf({ path: pdf2, format: 'A4', printBackground: false });
check('exported html prints one page', pdfPages(pdf2), 1);
await p2.close();

const [docDl] = await Promise.all([page.waitForEvent('download'), page.locator('#btnWord').click()]);
check('word file is offered', docDl.suggestedFilename().endsWith('.doc'), true);

/* autosave */
await page.reload();
await page.waitForTimeout(800);
check('everything survives a reload', await page.locator('.ident .nm').innerText(), 'Test Person');

check('no browser errors', errors, (e) => e.length === 0);
if (errors.length) console.log(errors.slice(0, 8));

await browser.close();
fs.rmSync(TMP, { recursive: true, force: true });

console.log(failures.length ? `\n${failures.length} check(s) failed: ${failures.join(', ')}` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
