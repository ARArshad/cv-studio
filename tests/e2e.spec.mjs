/**
 * End to end checks in a real browser against a production build.
 *
 *   npm run build
 *   npm run test:e2e            (starts `next start` on port 3210 itself)
 *   BASE_URL=http://localhost:3000 npm run test:e2e   (use a running server)
 *
 * Every check prints pass or FAIL; any failure exits non zero.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const failures = [];
function check(name, actual, expected) {
  const ok = typeof expected === "function" ? expected(actual) : actual === expected;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}: ${JSON.stringify(actual)}`);
  if (!ok) failures.push(name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const pdfPages = (buf) => {
  const s = buf.toString("latin1");
  return s.split("/Type /Page").length - s.split("/Type /Pages").length;
};

let server = null;
let BASE = process.env.BASE_URL;
if (!BASE) {
  BASE = "http://localhost:3210";
  server = spawn("npx", ["next", "start", "-p", "3210"], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) break; } catch { /* not up yet */ }
    await wait(500);
  }
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "cv-e2e-"));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
await ctx.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
page.on("dialog", (d) => d.accept());

const preview = () => page.getByTestId("preview");
const previewText = async () => (await preview().locator(".cv-pages").innerText());
const pageCount = async () => preview().locator(".cv-pages .cv-page").count();

try {
  /* landing */
  await page.goto(BASE + "/");
  check("landing page has a headline", await page.locator("h1").innerText(), (t) => t.includes("professional CV"));
  await page.waitForTimeout(800);
  check("landing page shows template previews", await page.locator(".cv-page").count(), (n) => n >= 5);

  /* landing call to action opens the new CV dialog */
  await page.getByTestId("hero-cta").click();
  await page.waitForURL(/dashboard/);
  await page.getByTestId("new-title").waitFor();
  check("call to action opens the new CV dialog", await page.getByTestId("new-title").isVisible(), true);

  /* create from the example in the Atlas template */
  await page.getByTestId("new-title").fill("Marketing roles");
  await page.locator('[role=dialog] [data-template="atlas"]').click();
  await page.getByTestId("new-create").click();
  await page.waitForURL(/\/editor\//);
  await preview().locator(".cv-pages .cv-page").first().waitFor();
  check("editor opens with the chosen template", await preview().locator(".cv-pages .cv-page").first().getAttribute("class"), (c) => c.includes("tpl-atlas"));
  check("example content is on the page", await previewText(), (t) => t.includes("Brightline Software"));
  check("the CV name shows in the top bar", await page.getByTestId("cv-name").inputValue(), "Marketing roles");

  /* typing updates the preview */
  await page.getByTestId("full-name").fill("Sam Taylor");
  await page.waitForTimeout(300);
  check("name change shows on the page", await preview().locator(".cv-pages .cv-name").first().innerText(), "Sam Taylor");

  /* undo and redo */
  await page.getByTestId("undo").click();
  await page.waitForTimeout(200);
  check("undo restores the name", await preview().locator(".cv-pages .cv-name").first().innerText(), "Alex Morgan");
  await page.getByTestId("redo").click();
  await page.waitForTimeout(200);
  check("redo puts it back", await preview().locator(".cv-pages .cv-name").first().innerText(), "Sam Taylor");

  /* edit a job: open experience, open first job, add a bullet */
  const exp = page.locator('[data-testid=section-card]', { hasText: "Work Experience" });
  await exp.getByTestId("section-toggle").click();
  await exp.getByTestId("entry-toggle").first().click();
  const desc = exp.getByTestId("entry-description").first();
  await desc.click();
  await desc.evaluate((el) => el.setSelectionRange(el.value.length, el.value.length));
  await desc.press("Enter");
  await page.keyboard.type("Opened three new regional markets.");
  await page.waitForTimeout(500);
  check("enter in a bullet starts a new bullet", await previewText(), (t) => t.includes("Opened three new regional markets."));

  /* clicking a section on the page opens it in the panel */
  await preview().locator('.cv-pages .blk[data-section]', { hasText: "EDUCATION" }).first().click();
  await page.waitForTimeout(400);
  check("clicking the page opens that section", await page.locator('[data-testid=section-card]', { hasText: "Education" }).getByTestId("section-title").inputValue(), "Education");

  /* hide a section */
  const interests = page.locator('[data-testid=section-card]', { hasText: "Interests" });
  await interests.getByTestId("section-hide").click();
  await page.waitForTimeout(300);
  check("a hidden section leaves the page", await previewText(), (t) => !t.includes("Fell running"));
  await interests.getByTestId("section-hide").click();

  /* add a section */
  await page.getByTestId("add-section").click();
  await page.locator('[data-add="projects"]').click();
  const proj = page.locator('[data-testid=section-card]', { hasText: "Projects" });
  await proj.getByTestId("entry-title").fill("Pricing calculator");
  await page.waitForTimeout(300);
  check("a new section shows on the page", await previewText(), (t) => t.includes("PROJECTS") && t.includes("Pricing calculator"));

  /* design */
  await page.locator('[data-tab="design"]').click();
  await page.locator('[data-color="#15803d"]').click();
  await page.waitForTimeout(200);
  check("colour applies to the page", await preview().locator(".cv-pages .cv-page").first().evaluate((e) => e.style.getPropertyValue("--accent")), "#15803d");
  await page.locator('[data-testid=skill-style] [data-value="bars"]').click();
  await page.waitForTimeout(200);
  check("skill levels can be bars", await preview().locator(".cv-pages .lvl-bar").count(), (n) => n > 0);
  await page.locator('[data-testid=photo-shape] [data-value="off"]').click();
  await page.waitForTimeout(200);
  check("the photo can be hidden", await preview().locator(".cv-pages .photo").count(), 0);

  /* templates keep the content */
  await page.locator('[data-tab="templates"]').click();
  for (const id of ["aurora", "meridian", "summit", "harbor", "vertex", "chronicle", "ledger", "linen", "prism", "atlas"]) {
    await page.locator(`[data-testid=panel] [data-template="${id}"]`).click();
    await page.waitForTimeout(250);
    const cls = await preview().locator(".cv-pages .cv-page").first().getAttribute("class");
    const text = await previewText();
    check(`${id} renders with the content`, [cls.includes(`tpl-${id}`), text.includes("Pricing calculator"), text.toLowerCase().includes("sam taylor")].join(","), "true,true,true");
  }

  /* long CVs flow onto more pages, and the PDF has the same number */
  await page.locator('[data-tab="content"]').click();
  await exp.getByTestId("section-toggle").click();
  const before = await pageCount();
  for (let i = 0; i < 4; i++) {
    await exp.getByTestId("add-entry").click();
    await exp.getByTestId("entry-title").last().fill(`Extra job ${i + 1}`);
    await exp.getByTestId("entry-description").last().fill(Array.from({ length: 6 }, (_, k) => `- Delivered result number ${k + 1} with measurable impact for the team and the customer.`).join("\n"));
  }
  await page.waitForTimeout(800);
  const after = await pageCount();
  check("a long CV runs onto more pages", after > before, true);
  check("the page counter agrees", await page.getByTestId("page-count").innerText(), `${after} pages`);
  const overflow = await preview().locator(".cv-pages .cv-page").evaluateAll((pages) => pages.some((p) => [...p.querySelectorAll(".col")].some((c) => c.scrollHeight > c.clientHeight + 2)));
  check("no page overflows its column", overflow, false);

  await page.getByTestId("download-pdf").click();
  await page.waitForTimeout(300);
  check("download PDF opens the print dialog", await page.evaluate(() => window.__printed), 1);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false });
  check("the PDF has one page per sheet", pdfPages(pdf), after);
  const pdfText = pdf.toString("latin1");
  check("the PDF is A4", /MediaBox \[0 0 59[45](\.\d+)? 84[12](\.\d+)?\]/.test(pdfText), true);

  /* everything survives a reload */
  await page.reload();
  await preview().locator(".cv-pages .cv-page").first().waitFor();
  await page.waitForTimeout(400);
  check("changes survive a reload", (await previewText()).includes("Extra job 4"), true);

  /* the dashboard */
  await page.getByTestId("back").click();
  await page.waitForURL(/dashboard/);
  await page.getByTestId("cv-card").first().waitFor();
  check("the CV is listed", await page.getByTestId("cv-title").first().innerText(), "Marketing roles");

  /* rename */
  await page.getByTestId("cv-title").first().click();
  await page.getByTestId("rename-input").fill("Marketing, London");
  await page.getByTestId("rename-input").press("Enter");
  check("rename from the card", await page.getByTestId("cv-title").first().innerText(), "Marketing, London");

  /* duplicate */
  await page.getByTestId("card-menu").first().click();
  await page.getByRole("button", { name: "Duplicate" }).click();
  await page.waitForTimeout(300);
  check("duplicate adds a card", await page.getByTestId("cv-card").count(), 2);

  /* download a copy, delete, import it back */
  await page.getByTestId("card-menu").first().click();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download a copy" }).click()]);
  const saved = path.join(TMP, dl.suggestedFilename());
  await dl.saveAs(saved);
  check("a copy downloads as JSON", dl.suggestedFilename().endsWith(".json"), true);
  await page.getByTestId("card-menu").first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.waitForTimeout(300);
  check("delete removes a card", await page.getByTestId("cv-card").count(), 1);
  await page.getByTestId("import-file").setInputFiles(saved);
  await page.waitForURL(/\/editor\//);
  await preview().locator(".cv-pages .cv-page").first().waitFor();
  check("an imported copy opens in the editor", (await previewText()).includes("Extra job 4"), true);

  /* a CV saved by the earlier single file app imports too */
  const legacy = path.join(TMP, "old.cvjson");
  fs.writeFileSync(legacy, JSON.stringify({
    v: 2,
    profile: { name: "Jordan Blake", role: "Site Electrician", photo: "", details: [{ icon: "mail", text: "jordan@example.com" }] },
    sections: [
      { id: "a", type: "text", title: "Profile", col: "main", show: true, body: "Reliable electrician with <b>seven years</b> on site." },
      { id: "b", type: "entries", title: "Employment", col: "main", show: true, items: [{ title: "Site Electrician", sub: "Rowland Building", date: "2019 to present", pts: ["Installed containment.", "Tested circuits."] }] },
      { id: "c", type: "skills", title: "Skills", col: "side", show: true, items: [{ name: "Wiring", level: 4 }] },
    ],
    design: { template: "modern" },
  }));
  await page.getByTestId("back").click();
  await page.waitForURL(/dashboard/);
  await page.getByTestId("import-file").setInputFiles(legacy);
  await page.waitForURL(/\/editor\//);
  await preview().locator(".cv-pages .cv-page").first().waitFor();
  const lt = await previewText();
  check("an old .cvjson imports with its content", lt.includes("Jordan Blake") && lt.includes("Rowland Building") && lt.includes("Tested circuits."), true);
  check("old bold text stays bold", await preview().locator(".cv-pages .summary strong").first().innerText(), "seven years");

  /* blank CV */
  await page.goto(BASE + "/dashboard");
  await page.getByTestId("new-cv").click();
  await page.locator('[data-start="blank"]').click();
  await page.getByTestId("new-create").click();
  await page.waitForURL(/\/editor\//);
  await preview().locator(".cv-pages .cv-page").first().waitFor();
  check("a blank CV has no example content", (await previewText()).includes("Brightline"), false);
  check("a blank CV scores low with tips", await page.getByTestId("score").innerText(), (t) => parseInt(t.replace(/\D/g, ""), 10) < 50);

  /* an unknown CV id goes back to the dashboard */
  await page.goto(BASE + "/editor/nope");
  await page.waitForURL(/dashboard/);
  check("a missing CV goes back to the dashboard", page.url().endsWith("/dashboard"), true);

  /* phone width */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/");
  check("landing has no sideways scroll on a phone", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
  await page.goto(BASE + "/dashboard");
  await page.getByTestId("cv-card").first().waitFor();
  check("dashboard has no sideways scroll on a phone", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
} catch (e) {
  failures.push("crashed");
  console.log("FAIL  crashed: " + e.message);
}

check("no browser errors", errors, (e) => e.length === 0);
if (errors.length) console.log(errors.slice(0, 6));

await browser.close();
server?.kill();
fs.rmSync(TMP, { recursive: true, force: true });
console.log(failures.length ? `\n${failures.length} check(s) failed: ${failures.join(", ")}` : "\nall checks passed");
process.exit(failures.length ? 1 : 0);
