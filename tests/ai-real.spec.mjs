/** Opt-in integration check: downloads ~550 MB and performs real CPU inference.
 * BASE_URL=http://localhost:3211 npm run test:ai:real
 * AI_TEST_PROFILE=/tmp/cv-ai-test-profile optionally keeps a dedicated cache.
 * Never point this synthetic-data test at a personal browser profile. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3211";
const browser = process.env.AI_TEST_PROFILE ? null : await chromium.launch();
const context = browser
  ? await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  : await chromium.launchPersistentContext(process.env.AI_TEST_PROFILE, {
      viewport: { width: 1440, height: 1000 },
    });
try {
  // Observe real worker failures without replacing or simulating inference.
  await context.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener("message", (event) => {
          if (event.data?.type === "error")
            window.__aiRuntimeError = event.data.message;
        });
      }
    };
  });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(base))
      requests.push({
        url: request.url(),
        method: request.method(),
        body: request.postData(),
      });
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/dashboard?new=1");
  await page.getByTestId("new-full-name").fill("Jordan Lee");
  await page.getByTestId("new-create").click();
  await page.waitForURL(/editor\?id=/);
  const id = new URL(page.url()).searchParams.get("id");
  const data = () =>
    page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem("cv-studio:library")).state.cvs[id]
          .data,
      id,
    );
  const original = await data();
  await page.locator("[data-tool=ai]").click();
  await page
    .getByTestId("ai-source")
    .fill("Responsible for creating weekly sales reports used by 12 analysts.");
  assert.equal(requests.length, 0, "no model download before opt-in");
  await page.getByRole("button", { name: "Load free AI", exact: true }).click();
  console.log(
    "Downloading/loading the optional local model (up to 10 minutes)…",
  );
  await page.waitForFunction(
    () =>
      window.__aiRuntimeError ||
      document.querySelector("[data-testid=ai-generate]")?.disabled === false,
    null,
    { timeout: 600000 },
  );
  assert.equal(await page.evaluate(() => window.__aiRuntimeError), undefined);
  await page.getByTestId("ai-generate").click();
  await page.waitForFunction(
    () =>
      window.__aiRuntimeError ||
      (!document.querySelector("[data-testid=ai-generate]")?.disabled &&
        document.querySelector("[data-testid=ai-result]")?.value.length > 0),
    null,
    { timeout: 240000 },
  );
  assert.equal(await page.evaluate(() => window.__aiRuntimeError), undefined);
  const result = await page.getByTestId("ai-result").inputValue();
  assert.ok(result.includes("12"), "rewrite preserves supplied numeric fact");
  assert.match(
    result,
    /(?:used by|for) 12 analysts/i,
    "rewrite preserves who uses the reports",
  );
  assert.ok(
    !/could you|provide more details|how can i help/i.test(result),
    "returns a rewrite instead of a question",
  );
  assert.deepEqual(
    await data(),
    original,
    "inference does not mutate the document",
  );
  assert.equal(await page.getByTestId("ai-apply").isEnabled(), true);
  await page.getByTestId("ai-apply").click();
  await page
    .getByText("Applied. You can undo this change in the editor.", {
      exact: true,
    })
    .waitFor();
  assert.ok(JSON.stringify(await data()).includes("12"));
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.deepEqual(await data(), original);
  assert.deepEqual(
    requests.filter(
      (request) => !["GET", "HEAD"].includes(request.method) || request.body,
    ),
    [],
    "no CV text upload",
  );
  assert.deepEqual(errors, []);
  console.log(
    "pass: real CPU model inference, factual rewrite, explicit application, undo and no remote text upload",
  );
  console.log("Suggestion:", result);
} finally {
  await context.close();
  if (browser) await browser.close();
}
