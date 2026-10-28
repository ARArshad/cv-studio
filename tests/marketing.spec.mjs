/** Regression checks for the product demonstration and expanded design collection. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3211";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/");
  const doc = page.getByTestId("showcase-document");
  await doc.locator(".cv-pages > .cv-page").waitFor();
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await page.getByLabel("Preview name", { exact: true }).fill("Jamie Chen");
  await page
    .getByLabel("Preview professional title", { exact: true })
    .fill("Product Designer");
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="showcase-document"]')
      ?.innerText.toLowerCase()
      .includes("jamie chen"),
  );
  assert.ok((await doc.innerText()).includes("Product Designer"));
  await page.getByRole("tab", { name: "Experience", exact: true }).click();
  await page
    .getByLabel("Preview achievement", { exact: true })
    .fill("Created a clear reporting workflow for 12 colleagues.");
  assert.ok((await doc.innerText()).includes("12 colleagues"));
  await page.getByRole("tab", { name: "Design", exact: true }).click();

  await page.getByRole("button", { name: "Boardroom", exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="showcase-document"]')
      ?.innerText.toLowerCase()
      .includes("jamie chen"),
  );
  assert.ok((await doc.innerText()).includes("12 colleagues"));
  assert.ok((await doc.locator(".tpl-boardroom").count()) > 0);
  assert.ok(
    (await doc.innerText()).includes("Brightline Software"),
    "switching templates preserves example work history",
  );
  await page.getByLabel("Preview colour #a74726", { exact: true }).click();
  assert.equal(
    await doc
      .locator(".cv-pages > .cv-page")
      .evaluate((el) => el.style.getPropertyValue("--accent")),
    "#a74726",
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Open full builder", exact: true })
      .getAttribute("href"),
    "/dashboard?new=1&template=boardroom",
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("cv-studio:library")),
    null,
    "preview must not create or overwrite documents",
  );
  await page.getByRole("tab", { name: "Design", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page
      .getByRole("tab", { name: "Profile", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  await page
    .getByRole("button", { name: "Reset example preview", exact: true })
    .click();
  assert.ok((await doc.innerText()).toLowerCase().includes("alex morgan"));
  console.log(
    "pass: real preview edits, content-preserving template switch, colours, reset, keyboard tabs, and no library mutation",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      `marketing overflow at ${width}`,
    );
    await page.getByTestId("builder-showcase").scrollIntoViewIfNeeded();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      `preview overflow at ${width}`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/templates");
  await page.getByTestId("gallery-categories").waitFor();
  assert.equal(await page.locator("article").count(), 65);
  await page
    .getByRole("button", { name: "Studio collection", exact: true })
    .click();
  assert.equal(await page.locator("article").count(), 16);
  await page.getByLabel("Search templates", { exact: true }).fill("Basic");
  assert.equal(await page.locator("article").count(), 1);
  await page
    .getByRole("button", { name: "Preview Clarity template", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  assert.ok((await page.getByRole("dialog").innerText()).includes("Clarity"));
  await page.keyboard.press("Escape");
  await page.getByLabel("Search templates", { exact: true }).fill("");
  await page
    .getByRole("link", { name: "Use Scholar template", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  assert.equal(
    await page.locator("[data-template=scholar]").getAttribute("aria-pressed"),
    "true",
  );
  assert.deepEqual(errors, []);
  console.log(
    "pass: 65 templates, 16-design collection, style search, modal preview, creation selection, phone layouts and no runtime errors",
  );
} finally {
  await browser.close();
}
