/** Focused regression checks for independent CVs, browser privacy and template selection.
 * Run against a running app: BASE_URL=http://localhost:3211 node tests/library.spec.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3210";
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  async function create(title, name) {
    await page.goto(base + "/dashboard?new=1");
    await page.getByTestId("new-title").fill(title);
    assert.equal(
      await page.locator('[data-start="blank"]').getAttribute("aria-pressed"),
      "true",
    );
    await page.getByTestId("new-create").click();
    await page.waitForURL(/editor\?id=/);
    const id = new URL(page.url()).searchParams.get("id");
    const field = page.locator('[data-testid=preview] [data-path="name"]');
    await field.fill(name);
    await field.blur();
    return id;
  }
  const first = await create("Engineering application", "Taylor Quinn");
  const second = await create("Design application", "Morgan Lane");
  assert.notEqual(first, second);
  await page.reload();
  await page.locator('[data-testid=preview] [data-path="name"]').waitFor();
  assert.equal(
    await page.locator('[data-testid=preview] [data-path="name"]').innerText(),
    "Morgan Lane",
  );
  await page.goto(`${base}/editor?id=${first}`);
  assert.equal(
    await page.locator('[data-testid=preview] [data-path="name"]').innerText(),
    "Taylor Quinn",
  );
  await page.goto(base + "/dashboard");
  await page.getByTestId("cv-card").first().waitFor();
  assert.equal(await page.getByTestId("cv-card").count(), 2);
  await page.getByTestId("card-menu").first().click();
  await page.getByRole("menuitem", { name: "Duplicate", exact: true }).click();
  assert.equal(await page.getByTestId("cv-card").count(), 3);
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("cv-studio:library")).state.cvs,
  );
  assert.equal(saved[first].data.personal.fullName, "Taylor Quinn");
  assert.equal(saved[second].data.personal.fullName, "Morgan Lane");
  assert.equal(new Set(Object.keys(saved)).size, 3);
  console.log(
    "pass: multiple CVs keep separate identities, IDs and persisted content; duplication creates a third CV",
  );

  const [backup] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Back up all documents", exact: true })
      .click(),
  ]);
  const backupBuffer = await fs.readFile(await backup.path());
  const collection = JSON.parse(backupBuffer.toString());
  assert.equal(collection.cvs.length, 3);
  assert.equal(collection.kind, "cv-studio/collection");
  const backupFile = {
    name: "CV Studio backup.json",
    mimeType: "application/json",
    buffer: backupBuffer,
  };
  await page.getByTestId("import-file").setInputFiles(backupFile);
  await page.getByRole("dialog", { name: "Restore CV backup" }).waitFor();
  assert.equal(await page.getByTestId("cv-card").count(), 3);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await page.getByTestId("cv-card").count(), 3);
  await page.getByTestId("import-file").setInputFiles(backupFile);
  await page.getByTestId("restore-confirm").click();
  assert.equal(await page.getByTestId("cv-card").count(), 6);
  await page.reload();
  await page.getByTestId("cv-card").first().waitFor();
  assert.equal(await page.getByTestId("cv-card").count(), 6);
  const restored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("cv-studio:library")).state.cvs,
  );
  assert.equal(restored[first].data.personal.fullName, "Taylor Quinn");
  assert.equal(restored[second].data.personal.fullName, "Morgan Lane");
  assert.equal(Object.keys(restored).length, 6);
  await page.getByTestId("import-file").setInputFiles({
    name: "damaged.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        kind: "cv-studio/collection",
        version: 1,
        cvs: [collection.cvs[0], null],
      }),
    ),
  });
  await page
    .getByRole("status")
    .filter({ hasText: "not a CV saved" })
    .waitFor();
  assert.equal(await page.getByTestId("cv-card").count(), 6);
  console.log(
    "pass: all-CV backup, restore preview, cancellation, fresh IDs, reload and atomic rejection of damaged backups",
  );

  const unsafe = structuredClone(collection.cvs[0]);
  unsafe.data.sections.find((section) => section.type === "summary").text =
    '<img src="invalid-image" onerror="window.__unsafeImport=1">Safe <b onclick="window.__unsafeImport=2">formatting</b><svg onload="window.__unsafeImport=3"></svg><script>window.__unsafeImport=4</script>';
  await page.evaluate(() => {
    window.__unsafeImport = 0;
  });
  await page.getByTestId("import-file").setInputFiles({
    name: "rich-text.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ kind: "cv-studio/cv", version: 2, cv: unsafe }),
    ),
  });
  await page.waitForURL(/editor\?id=/);
  const summary = page
    .locator("[data-testid=preview] .cv-pages .summary")
    .first();
  await summary.waitFor();
  assert.equal(await summary.locator("b").innerText(), "formatting");
  assert.equal(
    await summary.locator("img,svg,script,[onclick],[onerror]").count(),
    0,
  );
  assert.equal(await page.evaluate(() => window.__unsafeImport), 0);
  console.log(
    "pass: imported rich text keeps supported formatting while removing active markup and event handlers",
  );

  const other = await browser.newContext();
  const visitor = await other.newPage();
  await visitor.goto(base + "/dashboard");
  await visitor.getByTestId("dash-start").waitFor();
  assert.equal(await visitor.getByTestId("cv-card").count(), 0);
  console.log("pass: a separate browser context has its own empty library");
  await other.close();

  await page.goto(base + "/templates");
  await page.getByRole("textbox", { name: "Search templates" }).fill("Nordic");
  assert.equal(await page.locator("article").count(), 1);
  await page
    .getByRole("button", { name: "Preview Nordic template", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page
    .getByRole("textbox", { name: "Search templates" })
    .fill("no-such-template-999");
  await page.getByText("No templates found", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Reset filters" }).click();
  assert.equal(await page.locator("article").count(), 65);
  console.log(
    "pass: template search, preview, keyboard dismissal and filter reset",
  );

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/dashboard", "/templates", "/dashboard?new=1"]) {
      await page.goto(base + route);
      await page.waitForTimeout(400);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        `${route} overflows at ${width}px`,
      );
    }
  }
  console.log(
    "pass: marketing, dashboard, gallery and creation dialog fit mobile and tablet widths",
  );
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${base}/editor?id=${first}`);
    await page.getByTestId("preview").waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      true,
      `editor overflows at ${width}px`,
    );
    assert.equal(
      await page
        .getByRole("textbox", { name: "Document name", exact: true })
        .isVisible(),
      true,
    );
    for (const [button, panel] of [
      ["tb-layout", "layout-pop"],
      ["tb-fonts", "fonts-pop"],
      ["tb-themes", "themes-pop"],
      ["tb-page", "page-pop"],
    ]) {
      await page.getByTestId(button).click();
      const bounds = await page.getByTestId(panel).boundingBox();
      assert.ok(
        bounds.x >= 0 && bounds.x + bounds.width <= width,
        `${panel} extends off screen at ${width}px`,
      );
      await page.keyboard.press("Escape");
    }
  }
  await page.goto(`${base}/editor?id=constructor`);
  await page.waitForURL(/dashboard/);
  console.log(
    "pass: mobile editor, title field and design panels fit phone/tablet screens; invalid inherited IDs return to dashboard",
  );

  await page.goto(`${base}/dashboard?new=1&template=constructor`);
  await page.getByRole("dialog", { name: "Create a document" }).waitFor();
  assert.equal(
    await page
      .locator('[role=dialog] [data-template="pulse"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  console.log("pass: unknown template links fall back to a valid design");

  const restricted = await browser.newContext();
  await restricted.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota full", "QuotaExceededError");
    };
  });
  const restrictedPage = await restricted.newPage();
  await restrictedPage.goto(base + "/dashboard?new=1");
  await restrictedPage.getByTestId("new-create").click();
  await restrictedPage.waitForURL(/editor\?id=/);
  await restrictedPage
    .getByRole("alert")
    .filter({ hasText: "Save warning:" })
    .waitFor();
  assert.match(
    await restrictedPage
      .getByRole("alert")
      .filter({ hasText: "Save warning:" })
      .innerText(),
    /could not be saved/,
  );
  await restrictedPage
    .locator('[data-testid=preview] [data-path="name"]')
    .fill("Still editable");
  assert.equal(
    await restrictedPage
      .locator('[data-testid=preview] [data-path="name"]')
      .innerText(),
    "Still editable",
  );
  await restricted.close();
  console.log(
    "pass: failed browser writes show a save warning and leave the document editable",
  );

  assert.deepEqual(errors, []);
  console.log("pass: no browser errors");
} finally {
  await browser.close();
}
