/** Product checks for the new brand and nine restrained template designs. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3211";
const browser = await chromium.launch();
const ids = [
  "forma",
  "folio",
  "still",
  "aurelia",
  "serein",
  "opal",
  "vector",
  "signal",
  "arc",
];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.addInitScript(() => {
    window.__prints = 0;
    window.print = () => {
      window.__prints++;
    };
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/");
  assert.ok(
    await page
      .locator("header")
      .first()
      .getByRole("link", { name: "CV Studio", exact: true })
      .count(),
  );
  assert.equal(
    await page
      .locator("header")
      .first()
      .locator('svg[viewBox="0 0 64 64"]')
      .count(),
    1,
  );
  const icon = await page
    .locator('link[rel=icon][type="image/svg+xml"]')
    .getAttribute("href");
  assert.equal(
    (await page.request.get(new URL(icon, base).href)).status(),
    200,
  );
  const apple = await page
    .locator("link[rel=apple-touch-icon]")
    .getAttribute("href");
  const png = await (await page.request.get(new URL(apple, base).href)).body();
  assert.equal(png.readUInt32BE(16), 180);
  assert.equal(png.readUInt32BE(20), 180);
  for (const asset of [
    "cv-studio-mark.svg",
    "cv-studio-logo.svg",
    "cv-studio-logo-light.svg",
  ]) {
    const response = await page.request.get(base + "/brand/" + asset);
    assert.equal(response.status(), 200);
    assert.match(await response.text(), /<svg/);
  }
  await page.setViewportSize({ width: 320, height: 800 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/templates");
  await page
    .getByRole("button", { name: "The Edit · New", exact: true })
    .click();
  assert.equal(await page.locator("article").count(), 9);
  for (const family of ["Simple", "Elegant", "Futuristic"]) {
    await page.getByLabel("Search templates").fill(family);
    assert.equal(await page.locator("article").count(), 3);
  }
  await page.getByLabel("Search templates").fill("");
  console.log(
    "pass: new monogram, wordmark, downloadable SVGs, browser/home-screen icons and three discoverable design families",
  );
  const created = [];
  for (const id of ids) {
    await page.goto(base + "/dashboard?new=1&template=" + id);
    await page.locator("[data-start=example]").click();
    await page.getByTestId("new-full-name").fill("Premium Review");
    await page.getByTestId("new-create").click();
    await page.waitForURL(/editor\/?\?id=/);
    const cvId = new URL(page.url()).searchParams.get("id");
    created.push(cvId);
    await page
      .locator("[data-testid=preview] .cv-pages > .cv-page")
      .first()
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(180);
    const stored = await page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem("cv-studio:library")).state.cvs[id],
      cvId,
    );
    assert.equal(stored.design.template, id);
    assert.equal(stored.design.showPhoto, false);
    assert.equal(
      await page
        .locator("[data-testid=preview] .cv-pages > .cv-page .photo")
        .count(),
      0,
    );
    assert.ok(
      (
        await page.locator("[data-testid=preview] .cv-pages").textContent()
      ).includes("Premium Review"),
    );
    assert.equal(
      await page
        .locator("[data-testid=preview] .cv-pages > .cv-page .col")
        .evaluateAll((cols) =>
          cols.some((col) => col.scrollHeight > col.clientHeight + 2),
        ),
      false,
      id + " has no overflowing paper column",
    );
    const pages = await page
      .locator("[data-testid=preview] .cv-pages > .cv-page")
      .count();
    await page.getByTestId("download-pdf").click();
    await page.waitForFunction(() => window.__prints > 0);
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
    });
    const text = pdf.toString("latin1");
    const pdfPages =
      text.split("/Type /Page").length - text.split("/Type /Pages").length;
    assert.equal(pdfPages, pages, id + " PDF matches the paper preview");
    await fs.writeFile("/tmp/cv-edit-" + id + ".pdf", pdf);
    console.log(
      "pass: " +
        id +
        " creates independently without a photo, fits its pages and exports " +
        pages +
        " PDF page(s)",
    );
  }
  assert.equal(new Set(created).size, 9);
  await page.locator("[data-tool=templates]").click();
  await page
    .getByTestId("templates-drawer")
    .getByRole("button", { name: "The Edit", exact: true })
    .click();
  assert.equal(
    await page
      .getByTestId("templates-drawer")
      .locator("[data-template]")
      .count(),
    9,
  );
  await page
    .getByTestId("templates-drawer")
    .locator("[data-template=forma]")
    .click();
  assert.ok(
    (
      await page.locator("[data-testid=preview] .cv-pages").textContent()
    ).includes("Premium Review"),
  );
  await page.setViewportSize({ width: 320, height: 800 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
  await page.reload();
  await page
    .locator("[data-testid=preview] .cv-pages > .cv-page")
    .first()
    .waitFor();
  assert.ok(
    (
      await page.locator("[data-testid=preview] .cv-pages").textContent()
    ).includes("Premium Review"),
  );
  assert.deepEqual(errors, []);
  console.log(
    "pass: all nine document IDs are unique, editor collection filter works, template switches preserve content, phone layout and reload persist with no runtime errors",
  );
} finally {
  await browser.close();
}
