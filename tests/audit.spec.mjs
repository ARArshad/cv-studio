/** Full local-product regression checks. Start the app and set BASE_URL first. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3210";
const browser = await chromium.launch();
const state = (page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("cv-studio:library")).state,
  );
const pagesInPdf = (buffer) =>
  buffer.toString("latin1").split("/Type /Page").length -
  buffer.toString("latin1").split("/Type /Pages").length;
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    window.__prints = 0;
    window.print = () => {
      window.__prints++;
    };
  });
  const a = await context.newPage(),
    b = await context.newPage();
  const errors = [];
  for (const page of [a, b])
    page.on("pageerror", (error) => errors.push(error.message));
  await Promise.all([a.goto(base + "/dashboard"), b.goto(base + "/dashboard")]);
  async function create(page, title, name, role, example = false) {
    await page.getByTestId("new-cv").click();
    await page.getByTestId("new-title").fill(title);
    if (example) {
      await page.locator('[data-start="example"]').click();
      await page.getByTestId("new-persona").selectOption("engineer");
    }
    await page.getByTestId("new-full-name").fill(name);
    await page.getByTestId("new-job-title").fill(role);
    await page.getByTestId("new-create").click();
    await page.waitForURL(/editor\?id=/);
    await page
      .locator('[data-testid=preview] .cv-pages [data-path="name"]')
      .waitFor();
    return new URL(page.url()).searchParams.get("id");
  }
  const first = await create(
    a,
    "Engineering · English",
    "Jordan Lee",
    "Data Engineer",
    true,
  );
  const second = await create(
    b,
    "Design · English",
    "Morgan Lane",
    "Product Designer",
  );
  assert.equal(Object.keys((await state(a)).cvs).length, 2);
  await b.goto(`${base}/editor?id=${first}`);
  await b
    .locator('[data-testid=preview] .cv-pages [data-path="title"]')
    .fill("Staff Data Engineer");
  await a
    .locator('[data-testid=preview] .cv-pages [data-path="name"]')
    .fill("Jordan Lee-Smith");
  let saved = await state(a);
  assert.equal(saved.cvs[first].data.personal.jobTitle, "Staff Data Engineer");
  assert.equal(saved.cvs[first].data.personal.fullName, "Jordan Lee-Smith");
  assert.ok(saved.cvs[second]);
  console.log(
    "pass: two open tabs keep separate CVs and merge sequential edits without discarding the other tab's fields",
  );
  await a.locator("[data-tool=ats]").click();
  await a
    .getByTestId("ats-input")
    .fill(
      "Data Engineer with Python, SQL, Kafka and data modelling experience. Python and SQL required.",
    );
  await a.getByRole("button", { name: "Close", exact: true }).click();
  await a.locator("[data-tool=ats]").click();
  assert.match(await a.getByTestId("ats-input").inputValue(), /Kafka/);
  await a.getByRole("button", { name: "Close", exact: true }).click();
  await a.goto(base + "/dashboard");
  let card = a.locator(`[data-testid=cv-card][data-id="${first}"]`);
  await card.getByTestId("card-menu").click();
  await a.waitForFunction(
    () => document.activeElement?.textContent?.trim() === "Rename",
  );
  await a.keyboard.press("ArrowDown");
  assert.equal(
    await a.evaluate(() => document.activeElement.textContent.trim()),
    "Duplicate",
  );
  await a.keyboard.press("Escape");
  assert.equal(
    await card.getByTestId("card-menu").getAttribute("aria-expanded"),
    "false",
  );
  await card.getByTestId("card-menu").click();
  await a.getByRole("menuitem", { name: "Manage tags", exact: true }).click();
  await a.getByTestId("tag-input").fill("Engineering, English, Interview");
  await a.getByRole("button", { name: "Save tags", exact: true }).click();
  await a.getByLabel("Filter by tag").selectOption("Engineering");
  assert.equal(await a.getByTestId("cv-card").count(), 1);
  await a.getByLabel("Filter by tag").selectOption("");
  await a.getByTestId("new-cv").click();
  await a.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(
    await a.evaluate(() => document.activeElement?.dataset?.testid),
    "new-cv",
  );
  console.log(
    "pass: job descriptions persist, tags filter documents, menus support arrow keys, and modal focus returns to the trigger",
  );
  card = a.locator(`[data-testid=cv-card][data-id="${first}"]`);
  await card.getByTestId("card-menu").click();
  await a
    .getByRole("menuitem", { name: "Matching cover letter", exact: true })
    .click();
  await a.locator("[data-tool=letter]").waitFor();
  const letterId = new URL(a.url()).searchParams.get("id");
  saved = await state(a);
  assert.equal(
    saved.cvs[letterId].design.accent,
    saved.cvs[first].design.accent,
  );
  assert.equal(saved.cvs[letterId].data.personal.fullName, "Jordan Lee-Smith");
  await a.locator("[data-tool=letter]").click();
  await a.getByLabel("Company", { exact: true }).fill("Northstar Studio");
  await a.getByLabel("Recipient", { exact: true }).fill("Hiring Team");
  await a
    .getByRole("button", { name: "Create a starting outline", exact: true })
    .click();
  saved = await state(a);
  assert.ok(
    saved.cvs[letterId].data.letter.paragraphs[1].text.includes(
      saved.cvs[first].data.sections.find((s) => s.type === "experience")
        .entries[0].bullets[0],
    ),
  );
  await a
    .getByLabel("Paragraph 1", { exact: true })
    .fill("I build R&D systems <with care> & measurable results.");
  assert.equal(
    await a.getByLabel("Paragraph 1", { exact: true }).inputValue(),
    "I build R&D systems <with care> & measurable results.",
  );
  await a.getByRole("button", { name: "Close", exact: true }).click();
  const body = "[data-testid=preview] .cv-pages .letter-paragraph";
  await a.locator(body).first().waitFor();
  await a
    .locator(body)
    .first()
    .fill(
      "I am applying for the Staff Data Engineer role at Northstar Studio. I enjoy building reliable systems and making complex data useful.",
    );
  await a.locator(body).first().press("End");
  await a.locator(body).first().press("Enter");
  await a.waitForFunction(
    (id) =>
      JSON.parse(localStorage.getItem("cv-studio:library")).state.cvs[id].data
        .letter.paragraphs.length === 4,
    letterId,
  );
  await a.keyboard.type("This new paragraph was added directly on the page.");
  await a.reload();
  await a.locator(body).first().waitFor();
  assert.equal(await a.locator(body).count(), 4);
  await a.waitForTimeout(300);
  assert.ok((await a.getByTestId("page-count").innerText()).includes("1 page"));
  await a.locator("[data-tool=templates]").click();
  for (const id of [
    "pulse",
    "cascade",
    "monarch",
    "horizon",
    "mosaic",
    "nordic",
    "apex",
    "bloom",
    "sterling",
    "orbit",
    "aurora",
    "meridian",
    "summit",
    "atlas",
    "harbor",
    "vertex",
    "chronicle",
    "ledger",
    "linen",
    "prism",
    "zenith",
    "fusion",
    "catalyst",
    "campus",
    "terminal",
    "silicon",
    "elegance",
    "canvas",
    "keystone",
    "beacon",
    "aurum",
    "ember",
    "glacier",
    "halo",
    "ivory",
    "meadow",
    "onyx",
    "quartz",
    "ribbon",
    "solstice",
    "atelier",
    "clarity",
    "metro",
    "boardroom",
    "plain",
    "focus",
    "signature",
    "scholar",
    "strength",
    "whitespace",
    "bridge",
    "heritage",
    "versatile",
    "developer",
    "matrix",
    "balance",
    "forma",
    "folio",
    "still",
    "aurelia",
    "serein",
    "opal",
    "vector",
    "signal",
    "arc",
  ]) {
    await a.locator(`[data-testid=drawer] [data-template="${id}"]`).click();
    await a.waitForTimeout(60);
    assert.match(
      await a.locator("[data-testid=preview] .cv-pages").innerText(),
      /Jordan Lee-Smith/,
    );
    assert.equal(await a.locator(body).count(), 4);
  }
  await a.getByRole("button", { name: "Close", exact: true }).click();
  await a.getByTestId("download-more").click();
  const [textDownload] = await Promise.all([
    a.waitForEvent("download"),
    a.getByRole("button", { name: "Plain text (.txt)", exact: true }).click(),
  ]);
  assert.match(
    await fs.readFile(await textDownload.path(), "utf8"),
    /Northstar Studio/,
  );
  await a.getByTestId("download-pdf").click();
  await a.waitForFunction(() => window.__prints === 1);
  await a.evaluate(() => document.fonts.ready);
  await a.waitForTimeout(150);
  const pageCount = await a
    .locator("[data-testid=preview] .cv-pages > .cv-page")
    .count();
  assert.equal(pagesInPdf(await a.pdf({ preferCSSPageSize: true })), pageCount);
  await a.screenshot({ path: "/tmp/cv-audit-letter-desktop.png" });
  await a.getByTestId("download-more").click();
  const [letterBackup] = await Promise.all([
    a.waitForEvent("download"),
    a
      .getByRole("button", {
        name: "A copy to open later (.json)",
        exact: true,
      })
      .click(),
  ]);
  const letterBackupBytes = await fs.readFile(await letterBackup.path());
  console.log(
    "pass: matching cover letters preserve CV style, source achievements, editing, paragraph splitting, all 65 templates, reload, plain text and PDF output",
  );
  await a.getByTestId("back").click();
  await a.getByRole("button", { name: "Cover letters", exact: true }).click();
  assert.equal(await a.getByTestId("cv-card").count(), 1);
  await a.getByRole("button", { name: "CVs", exact: true }).click();
  assert.equal(await a.getByTestId("cv-card").count(), 2);
  await a.getByRole("button", { name: "All documents", exact: true }).click();
  card = a.locator(`[data-testid=cv-card][data-id="${first}"]`);
  await card.getByTestId("card-menu").click();
  await a.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await b.waitForURL(/dashboard/);
  await a.reload();
  await a.getByTestId("recently-deleted").click();
  assert.equal(await a.getByTestId("deleted-cv").count(), 1);
  await a.getByRole("button", { name: "Restore", exact: true }).click();
  await a.getByRole("button", { name: "Done", exact: true }).click();
  assert.ok((await state(a)).cvs[first]);
  assert.ok((await state(a)).cvs[letterId]);
  console.log(
    "pass: CV/letter views work and deletion is recoverable after reload and reflected in another open editor",
  );
  const imageData = await a.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 30;
    c.height = 60;
    const g = c.getContext("2d");
    g.fillStyle = "#216b55";
    g.fillRect(0, 0, 30, 60);
    return c.toDataURL("image/png");
  });
  await a.setViewportSize({ width: 320, height: 844 });
  await a.goto(`${base}/editor?id=${first}`);
  await a.getByTestId("photo-file").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from(imageData.split(",")[1], "base64"),
  });
  await a.getByTestId("cropper").waitFor();
  const bounds = await a.getByTestId("crop-area").boundingBox();
  assert.ok(
    bounds.width <= 250 && bounds.x >= 0 && bounds.x + bounds.width <= 320,
  );
  await a.getByTestId("crop-save").click();
  await a.reload();
  await a.getByTestId("preview").waitFor();
  saved = await state(a);
  assert.ok(
    saved.cvs[first].data.personal.photoSource?.startsWith("data:image/jpeg"),
  );
  await a.getByTestId("photo-file").setInputFiles({
    name: "broken.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("not a valid photo"),
  });
  await a
    .getByRole("status")
    .filter({ hasText: "could not be opened as a photo" })
    .waitFor();
  console.log(
    "pass: cropping fits a 320px screen, original images survive reload, and invalid image uploads show a useful error",
  );
  for (const width of [320, 768, 1440]) {
    await a.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/dashboard",
      "/templates",
      "/cover-letters",
      "/examples",
      "/guides",
      "/dashboard?new=1&kind=letter",
    ]) {
      await a.goto(base + route);
      await a.waitForTimeout(100);
      assert.equal(
        await a.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        `${route} overflows at ${width}px`,
      );
    }
    await a.goto(`${base}/editor?id=${letterId}`);
    await a.getByTestId("preview").waitFor();
    assert.equal(
      await a.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      true,
      `letter editor overflows at ${width}px`,
    );
  }
  console.log(
    "pass: marketing, workspace, templates, cover letters, examples, guides and creation fit small phones, tablets and desktop",
  );
  const protectedContext = await browser.newContext();
  const corrupted = '{"state":{"cvs":';
  await protectedContext.addInitScript((raw) => {
    if (!localStorage.getItem("cv-studio:library"))
      localStorage.setItem("cv-studio:library", raw);
  }, corrupted);
  const recovery = await protectedContext.newPage();
  await recovery.goto(base + "/dashboard");
  await recovery.getByTestId("new-cv").click();
  await recovery.getByTestId("new-create").click();
  await recovery.waitForURL(/editor\?id=/);
  assert.equal(
    await recovery.evaluate(() => localStorage.getItem("cv-studio:library")),
    corrupted,
  );
  await recovery
    .getByRole("alert")
    .filter({ hasText: "Save warning:" })
    .waitFor();
  const [original] = await Promise.all([
    recovery.waitForEvent("download"),
    recovery
      .getByRole("button", { name: "Download original data", exact: true })
      .click(),
  ]);
  assert.equal(await fs.readFile(await original.path(), "utf8"), corrupted);
  await recovery
    .getByRole("button", { name: "Minimise save warning", exact: true })
    .click();
  await recovery.locator("[data-tool=personal]").click();
  await recovery.getByTestId("full-name").fill("Recovered in memory");
  await recovery.getByRole("button", { name: "Close", exact: true }).click();
  await recovery.getByTestId("save-status").click();
  await recovery
    .getByRole("alert")
    .filter({ hasText: "Save warning:" })
    .waitFor();
  await protectedContext.close();
  console.log(
    "pass: unreadable storage is preserved instead of overwritten and its original bytes can be downloaded",
  );
  const importContext = await browser.newContext();
  const pdfSource = await importContext.newPage();
  await pdfSource.setContent(
    '<body style="font-family:Arial;padding:30px"><h1>Riley Chen</h1><p>Data Analyst</p><p>riley@example.com | Leeds, UK</p><h2>Experience</h2><p>Data Analyst, Northstar</p><p>2022 - Present</p><p>• Built reporting dashboards used by twelve teams</p><h2>Education</h2><p>BSc Statistics, Example University</p><h2>Skills</h2><p>Python, SQL, Excel, Reporting, Statistics</p></body>',
  );
  const sourcePdf = await pdfSource.pdf({ format: "A4" });
  await pdfSource.close();
  const importer = await importContext.newPage();
  importer.on("pageerror", (error) => errors.push(error.message));
  await importer.goto(base + "/dashboard?import=1");
  await importer
    .getByRole("dialog", { name: "Import an existing CV" })
    .waitFor();
  await importer.getByTestId("import-file").setInputFiles({
    name: "existing-cv.pdf",
    mimeType: "application/pdf",
    buffer: sourcePdf,
  });
  await importer.getByTestId("dashboard-import-preview").waitFor();
  assert.match(
    await importer.getByTestId("dashboard-import-preview").innerText(),
    /Riley Chen/,
  );
  await importer.getByTestId("dashboard-import-create").click();
  await importer.waitForURL(/editor\?id=/);
  await importer.locator("[data-testid=preview] .cv-pages").waitFor();
  assert.match(
    await importer.locator("[data-testid=preview] .cv-pages").innerText(),
    /Northstar/,
  );
  await importer.getByTestId("back").click();
  await importer.getByTestId("import-file").setInputFiles({
    name: "letter.json",
    mimeType: "application/json",
    buffer: letterBackupBytes,
  });
  await importer.waitForURL(/editor\?id=/);
  await importer
    .locator("[data-testid=preview] .cv-pages .letter-paragraph")
    .first()
    .waitFor();
  assert.equal(
    await importer
      .locator("[data-testid=preview] .cv-pages .letter-paragraph")
      .count(),
    4,
  );
  assert.match(
    await importer.locator("[data-testid=preview] .cv-pages").innerText(),
    /Northstar Studio/,
  );
  await importContext.close();
  console.log(
    "pass: an existing PDF imports directly from the dashboard with a review before creating its CV",
  );
  const missing = await a.goto(base + "/a-page-that-does-not-exist");
  assert.equal(missing.status(), 404);
  await a
    .getByRole("link", { name: "Browse templates", exact: true })
    .waitFor();
  console.log("pass: unknown public pages have a branded recovery page");

  assert.deepEqual(errors, []);
  console.log("pass: no browser runtime errors");
} finally {
  await browser.close();
}
