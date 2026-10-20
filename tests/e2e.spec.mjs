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

const TEMPLATES = ["pulse", "cascade", "monarch", "horizon", "mosaic", "nordic", "apex", "bloom", "sterling", "orbit",
  "aurora", "meridian", "summit", "atlas", "harbor", "vertex", "chronicle", "ledger", "linen", "prism",
  "zenith", "fusion", "catalyst", "campus", "terminal", "silicon", "elegance", "canvas", "keystone", "beacon",
  "aurum", "ember", "glacier", "halo", "ivory", "meadow", "onyx", "quartz", "ribbon", "solstice"];

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "cv-e2e-"));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
await ctx.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
page.on("dialog", (d) => d.accept());

const P = "[data-testid=preview] .cv-pages";
const doc = () => page.locator(P);
const text = async () => doc().innerText();
const pageCount = async () => page.locator(`${P} > .cv-page`).count();
const field = (p) => page.locator(`${P} [data-path="${p}"]`);
const caretToEnd = (loc) => loc.evaluate((el) => {
  el.focus();
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
});
const tool = async (id) => { await page.locator(`[data-tool="${id}"]`).click(); await page.waitForTimeout(250); };

try {
  /* landing */
  await page.goto(BASE + "/");
  check("landing page has a headline", await page.locator("h1").innerText(), (t) => t.includes("professional CV"));
  await page.waitForTimeout(800);
  check("landing page shows template previews with premium badges", await page.getByText("PREMIUM, FREE").count(), (n) => n >= 5);

  /* landing call to action opens the new CV dialog */
  await page.getByTestId("hero-cta").click();
  await page.waitForURL(/dashboard/);
  await page.getByTestId("new-title").waitFor();
  await page.getByTestId("new-title").fill("Marketing roles");
  await page.locator('[role=dialog] [data-template="sterling"]').click();
  await page.getByTestId("new-persona").selectOption("marketing");
  await page.getByTestId("new-create").click();
  await page.waitForURL(/\/editor\//);
  await page.locator(`${P} > .cv-page`).first().waitFor();
  check("editor opens with the chosen template", await page.locator(`${P} > .cv-page`).first().getAttribute("class"), (c) => c.includes("tpl-sterling"));
  check("example content is on the page", (await text()).includes("Brightline Software"), true);

  /* typing straight on the page */
  const name = field("name");
  await name.click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.type("Sam Taylor");
  await page.waitForTimeout(300);
  check("the name can be typed on the page", await name.innerText(), "Sam Taylor");
  check("the field keeps focus while typing", await page.evaluate(() => document.activeElement?.dataset?.path), "name");

  /* undo and redo */
  await page.evaluate(() => document.activeElement?.blur());
  await page.getByTestId("undo").click();
  await page.waitForTimeout(250);
  check("undo restores the name", await name.innerText(), "Alex Morgan");
  await page.getByTestId("redo").click();
  await page.waitForTimeout(250);
  check("redo puts it back", await name.innerText(), "Sam Taylor");

  /* bullets: Enter starts the next one, Backspace on an empty one removes it */
  const firstBullet = page.locator(`${P} [data-path^="bul:"]`).first();
  const bullets = () => page.locator(`${P} [data-path^="bul:"]`).count();
  const before = await bullets();
  await caretToEnd(firstBullet);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  await page.keyboard.type("Opened three new regional markets.");
  await page.waitForTimeout(400);
  check("Enter in a bullet starts a new bullet", (await text()).includes("Opened three new regional markets."), true);
  check("there is one more bullet", (await bullets()) - before, 1);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(250);
  check("Backspace on an empty bullet removes it", (await bullets()) - before, 1);

  /* bold */
  await page.keyboard.press("Shift+Home");
  await page.keyboard.press("Meta+B");
  await page.waitForTimeout(300);
  check("Cmd B makes text bold", await page.locator(`${P} li b`, { hasText: "regional markets" }).count(), (n) => n >= 1);

  /* the section toolbar */
  const interests = page.locator(`${P} .cv-h`, { hasText: "Interests" });
  await interests.hover();
  await interests.getByLabel("Hide section").click();
  await page.waitForTimeout(300);
  check("a section can be hidden from its toolbar", (await text()).includes("Fell running"), false);
  await tool("arrange");
  await page.locator("[data-testid=arrange-row]", { hasText: "Interests" }).getByTestId("arrange-hide").click();
  await page.waitForTimeout(300);
  check("and shown again from Rearrange", (await text()).includes("Fell running"), true);
  await tool("arrange");

  /* add an entry from the toolbar, and type into it */
  const edu = page.locator(`${P} .cv-h`, { hasText: "Education" });
  await edu.hover();
  await edu.getByLabel("Add entry").click();
  await page.waitForTimeout(300);
  await page.keyboard.type("MSc Data Science");
  await page.waitForTimeout(300);
  check("a new entry takes focus and can be typed into", (await text()).includes("MSc Data Science"), true);

  /* the entry menu shows and hides parts */
  const entry = page.locator(`${P} .entry`, { hasText: "MSc Data Science" });
  await entry.hover();
  await entry.getByLabel("Show or hide parts").click();
  await page.getByTestId("field-bullets").click();
  await page.waitForTimeout(250);
  await page.keyboard.press("Escape");
  check("bullets can be switched on for a section", await entry.locator("li").count(), (n) => n >= 1);

  /* add a section from the drawer */
  await tool("add");
  await page.locator('[data-add="projects"]').click();
  await page.waitForTimeout(400);
  check("a new section appears on the page", (await text()).includes("PROJECTS"), true);

  /* themes, page and layout */
  await page.getByTestId("tb-themes").click();
  await page.locator('[data-theme="Emerald"]').click();
  await page.waitForTimeout(200);
  check("a colour theme applies", await page.locator(`${P} > .cv-page`).first().evaluate((e) => e.style.getPropertyValue("--accent")), "#059669");
  await page.locator('[data-backdrop="dots"]').click();
  check("a background applies", await page.locator(`${P} > .cv-page`).first().getAttribute("class"), (c) => c.includes("bd-dots"));
  await page.keyboard.press("Escape");

  await page.getByTestId("tb-page").click();
  await page.locator('[data-testid=skill-style] [data-value="bars"]').click();
  await page.waitForTimeout(200);
  check("skill levels can be bars", await page.locator(`${P} .lvl-bar`).count(), (n) => n > 0);
  await page.locator('[data-testid=skill-style-2] [data-value="rings"]').click();
  await page.waitForTimeout(200);
  check("or rings", await page.locator(`${P} .ring`).count(), (n) => n > 0);
  await page.keyboard.press("Escape");

  await page.getByTestId("tb-layout").click();
  await page.locator('[data-layout="single"]').click();
  await page.waitForTimeout(300);
  check("the layout can change to one column", await page.locator(`${P} > .cv-page`).first().getAttribute("class"), (c) => c.includes("layout-single"));
  await page.locator('[data-layout="right"]').click();
  await page.getByTestId("toggle-photo").click();
  await page.waitForTimeout(250);
  check("the photo can be hidden", await page.locator(`${P} .photo`).count(), 0);
  await page.keyboard.press("Escape");

  await page.getByTestId("tb-fonts").click();
  await page.locator('[data-testid=fontHeading] [data-font="playfair"]').click();
  await page.waitForTimeout(200);
  check("a heading font applies", await page.locator(`${P} > .cv-page`).first().evaluate((e) => e.style.getPropertyValue("--font-head")), (v) => v.includes("playfair"));
  await page.keyboard.press("Escape");

  /* every template keeps the content */
  await tool("templates");
  for (const id of TEMPLATES) {
    await page.locator(`[data-testid=drawer] [data-template="${id}"]`).click();
    await page.waitForTimeout(250);
    const cls = await page.locator(`${P} > .cv-page`).first().getAttribute("class");
    const t = (await text()).toLowerCase();
    check(`${id} renders with the content`, [cls.includes(`tpl-${id}`), t.includes("sam taylor"), t.includes("msc data science")].join(","), "true,true,true");
  }
  await tool("templates");

  /* photo crop */
  await page.getByTestId("tb-layout").click();
  await page.getByTestId("toggle-photo").click();
  await page.keyboard.press("Escape");
  await page.locator(`${P} .photo`).first().click();
  await page.getByTestId("cropper").waitFor();
  const area = await page.getByTestId("crop-area").boundingBox();
  await page.mouse.move(area.x + 150, area.y + 150);
  await page.mouse.down();
  await page.mouse.move(area.x + 120, area.y + 170);
  await page.mouse.up();
  await page.getByTestId("crop-zoom").fill("1.5");
  await page.getByTestId("crop-save").click();
  await page.waitForTimeout(400);
  check("a cropped photo is saved", (await page.locator(`${P} .photo img`).first().getAttribute("src")).startsWith("data:image/jpeg"), true);

  /* dates come from a picker and follow the chosen format */
  const jobEntry = page.locator(`${P} .entry`, { hasText: "Senior Product Marketing Manager" }).first();
  await jobEntry.locator('[data-date$=":start"]').click();
  await page.getByTestId("date-year").fill("2019");
  await page.locator('[data-month="7"]').click();
  await page.waitForTimeout(250);
  check("a picked date shows on the page", await jobEntry.locator(".e-date").first().innerText(), (t) => t.startsWith("Jul 2019"));
  await page.getByTestId("tb-page").click();
  await page.locator('[data-testid=date-format] [data-value="mm/yyyy"]').click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  check("the date format applies everywhere", await jobEntry.locator(".e-date").first().innerText(), (t) => t.startsWith("07/2019"));

  /* ATS checker */
  await tool("ats");
  await page.getByTestId("ats-input").fill("Marketing manager with positioning, pricing, Salesforce and HubSpot experience. Salesforce and HubSpot skills essential.");
  await page.waitForTimeout(300);
  check("the ATS checker finds missing keywords", await page.getByTestId("ats-missing").innerText(), (t) => t.toLowerCase().includes("salesforce"));
  check("and ones already in the CV", await page.getByTestId("ats-found").innerText(), (t) => t.toLowerCase().includes("positioning"));
  await tool("ats");

  /* optimizer: markers on the page, with a fix */
  const weak = page.locator(`${P} [data-path^="bul:"]`).nth(1);
  await weak.click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.type("Responsible for the regional launch plan");
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(400);
  const mark = page.locator(`${P} li`, { hasText: "Responsible for the regional" }).getByTestId("opt-mark");
  check("a weak bullet gets a marker", await mark.count(), 1);
  await mark.click();
  await page.getByTestId("opt-pop-fix").first().click();
  await page.waitForTimeout(300);
  check("the fix rewrites the opening", (await text()).includes("Led the regional launch plan"), true);
  await tool("optimizer");
  check("the optimizer lists suggestions", await page.getByTestId("opt-item").count(), (n) => n > 0);
  await tool("optimizer");

  /* saved content */
  const firstEntry = page.locator(`${P} .entry`).first();
  await firstEntry.hover();
  await firstEntry.getByLabel("Save to my saved content").click();
  await tool("saved");
  check("an entry can be saved", await page.getByTestId("saved-item").count(), 1);
  await tool("saved");

  /* presets, footer, preferences, balancer, word spacing */
  await page.getByTestId("tb-layout").click();
  await page.locator('[data-layout="left"]').click();
  await page.locator('[data-preset="education"]').click();
  await page.getByTestId("toggle-page-numbers").click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check("page numbers show in the footer", await page.locator(`${P} .page-foot`).first().innerText(), (t) => t.includes("Page 1 of"));
  const firstMainHeading = await page.locator(`${P} .col.main .cv-h`).first().innerText();
  check("an arrangement preset reorders sections", firstMainHeading.toLowerCase(), (t) => t.includes("summary") || t.includes("education"));
  await page.getByTestId("tb-page").click();
  await page.getByTestId("country").selectOption("us");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  check("choosing the US switches to Letter paper", await page.locator(`${P} > .cv-page`).first().evaluate((e) => e.style.getPropertyValue("--page-w")), "816px");
  await page.getByTestId("tb-page").click();
  await page.getByTestId("country").selectOption("uk");
  await page.keyboard.press("Escape");
  const split = await page.getByTestId("balancer").innerText();
  await page.getByLabel("Move split right").click();
  await page.waitForTimeout(200);
  check("the balancer moves the column split", (await page.getByTestId("balancer").innerText()) !== split, true);
  await page.getByTestId("tb-fonts").click();
  await page.getByTestId("word-spacing").fill("0.1");
  await page.keyboard.press("Escape");
  check("word spacing applies", await page.locator(`${P} > .cv-page`).first().evaluate((e) => e.style.getPropertyValue("--ws")), "0.1em");

  /* phrases go into the job being edited */
  await caretToEnd(page.locator(`${P} [data-path^="bul:"]`).first());
  await tool("phrases");
  await page.getByTestId("phrase").first().click();
  await page.waitForTimeout(300);
  check("a phrase becomes a bullet", (await text()).includes("Results driven"), true);
  await tool("phrases");

  /* long CVs flow onto more pages, and the PDF has the same number */
  const exp = page.locator(`${P} .cv-h`, { hasText: "Experience" });
  const p0 = await pageCount();
  for (let i = 0; i < 4; i++) {
    await exp.hover();
    await exp.getByLabel("Add entry").click();
    await page.waitForTimeout(200);
    await page.keyboard.type(`Extra job ${i + 1}`);
    for (let k = 0; k < 5; k++) {
      const job = page.locator(`${P} .entry`, { hasText: `Extra job ${i + 1}` }).first();
      await job.hover();
      await job.getByLabel("Add bullet").click();
      await page.waitForTimeout(120);
      await page.keyboard.type(`Delivered result number ${k + 1} with measurable impact for the team and the customer.`);
    }
  }
  await page.waitForTimeout(800);
  const pages = await pageCount();
  check("a long CV runs onto more pages", pages > p0, true);
  check("the page counter agrees", await page.getByTestId("page-count").innerText(), `${pages} pages`);
  const overflow = await page.locator(`${P} > .cv-page`).evaluateAll((ps) => ps.some((p) => [...p.querySelectorAll(".col")].some((c) => c.scrollHeight > c.clientHeight + 2)));
  check("no page overflows its column", overflow, false);

  await page.getByTestId("download-pdf").click();
  await page.waitForTimeout(300);
  check("Download PDF opens the print dialog", await page.evaluate(() => window.__printed), 1);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false });
  check("the PDF has one page per sheet", pdfPages(pdf), pages);
  check("the PDF is A4", /MediaBox \[0 0 59[45](\.\d+)? 84[12](\.\d+)?\]/.test(pdf.toString("latin1")), true);

  /* everything survives a reload */
  await page.reload();
  await page.locator(`${P} > .cv-page`).first().waitFor();
  await page.waitForTimeout(400);
  check("changes survive a reload", (await text()).includes("Extra job 4"), true);

  /* the dashboard */
  await page.getByTestId("back").click();
  await page.waitForURL(/dashboard/);
  await page.getByTestId("cv-card").first().waitFor();
  check("the CV is listed", await page.getByTestId("cv-title").first().innerText(), "Marketing roles");
  await page.getByTestId("cv-title").first().click();
  await page.getByTestId("rename-input").fill("Marketing, London");
  await page.getByTestId("rename-input").press("Enter");
  check("rename from the card", await page.getByTestId("cv-title").first().innerText(), "Marketing, London");
  await page.getByTestId("card-menu").first().click();
  await page.getByRole("button", { name: "Duplicate" }).click();
  await page.waitForTimeout(300);
  check("duplicate adds a card", await page.getByTestId("cv-card").count(), 2);
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
  await page.locator(`${P} > .cv-page`).first().waitFor();
  check("an imported copy opens in the editor", (await text()).includes("Extra job 4"), true);

  /* a file saved by the first Next.js version: "- " bullets and **bold** */
  const v1 = path.join(TMP, "v1.json");
  fs.writeFileSync(v1, JSON.stringify({ kind: "cv-studio/cv", version: 1, cv: {
    title: "Old format", data: {
      personal: { fullName: "Riley Chen", jobTitle: "Nurse", photo: "", details: [] },
      sections: [
        { id: "a", type: "summary", title: "Profile", column: "main", hidden: false, text: "Caring nurse with **ten years** on wards.", entries: [], items: [] },
        { id: "b", type: "experience", title: "Work", column: "main", hidden: false, text: "", items: [], entries: [
          { id: "e", title: "Staff Nurse", subtitle: "City Hospital", location: "", startDate: "2015", endDate: "", current: true, description: "- Led a team of six.\n- Cut waiting times." },
        ] },
      ],
    }, design: { template: "aurora" },
  } }));
  await page.getByTestId("back").click();
  await page.waitForURL(/dashboard/);
  await page.getByTestId("import-file").setInputFiles(v1);
  await page.waitForURL(/\/editor\//);
  await page.locator(`${P} > .cv-page`).first().waitFor();
  check("first version bullets become bullets", await page.locator(`${P} li`, { hasText: "Cut waiting times." }).count(), 1);
  check("first version bold stays bold", await page.locator(`${P} .summary b`).innerText(), "ten years");

  /* import an old CV from a PDF */
  const pdfPage = await ctx.newPage();
  await pdfPage.setContent(`<body style="font-family:Arial;padding:40px">
    <h1>Morgan Lee</h1><p>Warehouse Supervisor</p><p>morgan.lee@example.com | +44 7700 900888 | Hull, UK</p>
    <h2>Experience</h2><p>Shift Supervisor, Humber Logistics</p><p>Jan 2020 - Present</p>
    <p>• Led a team of 14 pickers on nights</p><p>• Raised pick accuracy to 99.6%</p>
    <h2>Education</h2><p>NVQ Level 3 Warehousing, Hull College</p><p>2015 - 2016</p>
    <h2>Skills</h2><p>Team leadership, Forklift, Stock control</p></body>`);
  const oldPdf = path.join(TMP, "old-cv.pdf");
  await pdfPage.pdf({ path: oldPdf, format: "A4" });
  await pdfPage.close();
  await tool("import");
  await page.getByTestId("import-cv-file").setInputFiles(oldPdf);
  await page.getByTestId("import-preview").waitFor({ timeout: 15000 });
  check("a PDF is read and sorted into sections", await page.getByTestId("import-preview").innerText(), (t) => t.includes("Morgan Lee") && t.includes("Experience") && t.includes("Skills"));
  await page.getByTestId("import-new").click();
  await page.waitForURL((u) => u.pathname.startsWith("/editor/"));
  await page.waitForTimeout(800);
  const it = await text();
  check("the imported CV has the job and bullets", it.includes("Humber Logistics") && it.includes("Raised pick accuracy to 99.6%"), true);

  /* a .cvjson from the single file app */
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
  await page.locator(`${P} > .cv-page`).first().waitFor();
  const lt = await text();
  check("an old .cvjson imports with its content", lt.includes("Jordan Blake") && lt.includes("Rowland Building") && lt.includes("Tested circuits."), true);
  check("old bold text stays bold", await page.locator(`${P} .summary b`).first().innerText(), "seven years");

  /* example content suits the role */
  await page.goto(BASE + "/dashboard");
  await page.getByTestId("new-cv").click();
  await page.locator('[data-cat="tech"]').click();
  await page.locator('[role=dialog] [data-template="silicon"]').click();
  await page.getByTestId("new-create").click();
  await page.waitForURL(/\/editor\//);
  await page.locator(`${P} > .cv-page`).first().waitFor();
  check("a tech template starts with a tech example", (await text()).includes("Software Engineer"), true);

  /* dashboard search */
  await page.goto(BASE + "/dashboard");
  await page.getByTestId("cv-card").first().waitFor();
  await page.getByTestId("dash-search").fill("zzz-nothing");
  check("dashboard search filters the list", await page.getByTestId("cv-card").count(), 0);
  await page.getByTestId("dash-search").fill("");

  /* blank CV */
  await page.goto(BASE + "/dashboard");
  await page.getByTestId("new-cv").click();
  await page.locator('[data-start="blank"]').click();
  await page.getByTestId("new-create").click();
  await page.waitForURL(/\/editor\//);
  await page.locator(`${P} > .cv-page`).first().waitFor();
  check("a blank CV has no example content", (await text()).includes("Brightline"), false);
  check("a blank CV shows placeholders to type into", await page.locator(`${P} [data-path=name]`).getAttribute("data-ph"), "Your Name");
  check("a blank CV has issues to fix", await page.getByTestId("issue-count").innerText(), (t) => Number(t) >= 6);

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
