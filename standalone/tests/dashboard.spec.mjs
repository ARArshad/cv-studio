/**
 * The dashboard: many CVs side by side, each saved on its own.
 *
 *   npm run test:dash
 *
 * Covers bringing across a CV saved by the single CV version, creating CVs
 * from the dialog (example or blank, any template), that each CV keeps its
 * own content, thumbnails, renaming, duplicating, deleting, importing a
 * saved copy, and that a reload lands back on the same CV.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = pathToFileURL(path.join(ROOT, 'index.html')).href;
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'cv-studio-'));

const failures = [];
function check(name, actual, expected) {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}: ${JSON.stringify(actual)}`);
  if (!ok) failures.push(name);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('dialog', (d) => d.accept());

const cards = () => page.locator('#cards .card[data-id]');
const back = async () => { await page.locator('#btnBack').click(); await page.waitForTimeout(400); };

/* a CV left behind by the single CV version comes across */
await page.goto(APP);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('cv-studio-v2', JSON.stringify({
    v: 2,
    profile: { name: 'Old Saved Person', role: 'Plumber', photo: '', details: [] },
    sections: [{ id: 's1', type: 'text', title: 'Profile', col: 'main', show: true, body: 'Kept from before.' }],
    design: { template: 'modern', scheme: 2, vars: {}, skillStyle: 'dots', dateStyle: 'right', icons: '1', photoShape: '50%', showPhoto: true, zoom: 0.8 },
  }));
});
await page.reload();
await page.waitForTimeout(500);
check('opens on the dashboard', await page.locator('#dash').isVisible(), true);
check('the old CV is brought across', await cards().count(), 1);
check('it is named from the job title', await cards().first().locator('.cname').inputValue(), 'Plumber');

/* open it */
await cards().first().locator('.thumb').click();
await page.waitForTimeout(600);
check('the editor opens it', await page.locator('#pages .ident .nm').innerText(), 'Old Saved Person');
check('its template comes with it', await page.locator('#pages .page').first().getAttribute('data-tpl'), 'modern');
await back();
check('a thumbnail is drawn', await cards().first().locator('.tin .page').count(), 1);

/* new CV from the example, in another template */
await page.locator('#dashNew').click();
await page.locator('#newTitle').fill('Electrician CV');
await page.locator('.ntpl[data-tpl="executive"]').click();
await page.locator('#newGo').click();
await page.waitForTimeout(600);
check('the new CV opens in the editor', await page.locator('#app').isVisible(), true);
check('with the template picked', await page.locator('#pages .page').first().getAttribute('data-tpl'), 'executive');
check('and the example content', (await page.locator('#pages').innerText()).includes('Site Electrician'), true);
check('the panel shows its name', await page.locator('#cvTitle').inputValue(), 'Electrician CV');
await page.locator('#pages .ident .nm').click();
await page.keyboard.press('Meta+A');
await page.keyboard.type('Second Person');
await page.waitForTimeout(800);

/* a reload stays on the same CV */
await page.reload();
await page.waitForTimeout(700);
check('a reload stays on the CV', await page.locator('#pages .ident .nm').innerText(), 'Second Person');
await back();
check('two CVs listed', await cards().count(), 2);
check('newest first', await cards().first().locator('.cname').inputValue(), 'Electrician CV');

/* blank CV */
await page.locator('.card.newcard').click();
await page.locator('#newStart button[data-start="blank"]').click();
await page.locator('#newGo').click();
await page.waitForTimeout(600);
check('a blank CV has no example text', (await page.locator('#pages').innerText()).includes('Site Electrician'), false);
check('a blank CV has no name yet', (await page.locator('#pages .ident .nm').innerText()).trim(), '');
await back();
check('three CVs listed', await cards().count(), 3);

/* each CV keeps its own content */
await cards().filter({ has: page.locator('.cname[value="Plumber"]') }).locator('.thumb').click();
await page.waitForTimeout(500);
check('the first CV is untouched by the others', await page.locator('#pages .ident .nm').innerText(), 'Old Saved Person');
await back();

/* rename from the card */
const nm = cards().first().locator('.cname');
await nm.fill('Renamed CV');
await nm.press('Enter');
await page.reload();
await page.waitForTimeout(400);
check('a rename sticks', await cards().first().locator('.cname').inputValue(), 'Renamed CV');

/* rename from the editor */
await cards().first().locator('.thumb').click();
await page.waitForTimeout(500);
await page.locator('#cvTitle').fill('Renamed Again');
await page.locator('#cvTitle').press('Enter');
await back();
check('a rename in the editor shows on the dashboard', await cards().first().locator('.cname').inputValue(), 'Renamed Again');

/* duplicate */
await cards().first().locator('[data-act="menu"]').click();
await cards().first().locator('.cmenu [data-act="dup"]').click();
await page.waitForTimeout(300);
check('duplicate adds a CV', await cards().count(), 4);
check('the copy says so', await page.locator('#cards .cname').evaluateAll((e) => e.some((x) => x.value === 'Copy of Renamed Again')), true);

/* download a copy, delete, then import it back */
const target = cards().filter({ has: page.locator('.cname[value="Electrician CV"]') });
await target.locator('[data-act="menu"]').click();
const [dl] = await Promise.all([page.waitForEvent('download'), target.locator('.cmenu [data-act="export"]').click()]);
const saved = path.join(TMP, 'Electrician CV.cvjson');
await dl.saveAs(saved);
check('a copy downloads', dl.suggestedFilename(), 'Electrician CV.cvjson');
await target.locator('[data-act="menu"]').click();
await target.locator('.cmenu [data-act="del"]').click();
await page.waitForTimeout(300);
check('delete removes it', await cards().count(), 3);
check('and its document', await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('cv-studio-doc:')).length), 3);
await page.locator('#fileImport').setInputFiles(saved);
await page.waitForTimeout(700);
check('an imported copy opens', await page.locator('#pages .ident .nm').innerText(), 'Second Person');
await back();
check('and is listed', await cards().count(), 4);

/* a link to a CV that no longer exists goes home */
await page.goto(APP + '#/cv/nope');
await page.waitForTimeout(500);
check('a missing CV falls back to the dashboard', await page.locator('#dash').isVisible(), true);

await page.screenshot({ path: path.join(TMP, 'dash.png') });
if (process.env.SHOT) fs.copyFileSync(path.join(TMP, 'dash.png'), process.env.SHOT);

check('no browser errors', errors, (e) => e.length === 0);
if (errors.length) console.log(errors.slice(0, 8));

await browser.close();
fs.rmSync(TMP, { recursive: true, force: true });

console.log(failures.length ? `\n${failures.length} check(s) failed: ${failures.join(', ')}` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
