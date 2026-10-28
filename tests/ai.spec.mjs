/** Local-AI interface regression tests. Worker inference is mocked here;
 * real model download/inference is a separate manual integration check. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.BASE_URL || "http://localhost:3211";
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.addInitScript(() => {
    window.__aiRequests = [];
    window.__aiTerminated = 0;
    window.__aiMode = "normal";
    window.Worker = class {
      terminated = false;
      postMessage(request) {
        window.__aiRequests.push(request);
        const send = (data) => {
          if (!this.terminated) this.onmessage?.({ data });
        };
        if (window.__aiMode === "wait") return;
        if (window.__aiMode === "error") {
          setTimeout(
            () => send({ type: "error", message: "Simulated failure" }),
            20,
          );
          return;
        }
        if (request.type === "load") {
          send({
            type: "progress",
            progress: 0.5,
            text: "Downloading the AI model…",
          });
          setTimeout(() => send({ type: "ready" }), 20);
        } else {
          send({ type: "token", text: "Created weekly" });
          setTimeout(
            () =>
              send({
                type: "complete",
                text: "Created weekly reports for 12 analysts.",
              }),
            50,
          );
        }
      }
      terminate() {
        this.terminated = true;
        window.__aiTerminated++;
      }
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const remote = [];
  page.on("request", (r) => {
    if (/huggingface|hf\.co|cdn-lfs/.test(r.url())) remote.push(r.url());
  });
  await page.goto(base + "/dashboard?new=1");
  await page.getByTestId("new-create").click();
  await page.waitForURL(/editor\?id=/);
  const id = new URL(page.url()).searchParams.get("id");
  const stored = () =>
    page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem("cv-studio:library")).state.cvs[id],
      id,
    );
  await page.locator("[data-tool=ai]").click();
  assert.equal(await page.evaluate(() => window.__aiRequests.length), 0);
  assert.equal(remote.length, 0);
  const original = await stored();
  await page
    .getByTestId("ai-source")
    .fill("Responsible for creating weekly reports for 12 analysts.");
  await page.getByRole("button", { name: "Load free AI", exact: true }).click();
  await page.getByTestId("ai-generate").waitFor();
  await page.waitForFunction(
    () => !document.querySelector("[data-testid=ai-generate]").disabled,
  );
  await page.getByTestId("ai-generate").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-testid=ai-result]")?.value ===
      "Created weekly reports for 12 analysts.",
  );
  assert.deepEqual(
    (await stored()).data,
    original.data,
    "generation must not mutate CV",
  );
  await page.getByTestId("ai-result").fill("Created reports for 500 analysts.");
  assert.equal(await page.getByTestId("ai-apply").isDisabled(), true);
  await page
    .getByText("These numbers were not in the source:", { exact: false })
    .waitFor();
  await page
    .getByTestId("ai-result")
    .fill("Created weekly reports for 12 analysts.");
  await page.getByTestId("ai-apply").click();
  await page
    .getByText("Applied. You can undo this change in the editor.", {
      exact: true,
    })
    .waitFor();
  assert.ok(
    JSON.stringify((await stored()).data).includes(
      "Created weekly reports for 12 analysts.",
    ),
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.deepEqual(
    (await stored()).data,
    original.data,
    "AI application must be undoable",
  );
  assert.equal(
    await page.getByTestId("ai-apply").isDisabled(),
    true,
    "undo changes the target baseline",
  );
  await page
    .getByRole("button", { name: "Reload selected text", exact: true })
    .click();
  await page
    .getByTestId("ai-source")
    .fill("Responsible for creating weekly reports for 12 analysts.");
  console.log(
    "pass: opt-in only, review before application, numeric guard, editable output, apply and undo",
  );
  // Closing the panel must release model resources.
  await page.locator("[data-tool=templates]").click();
  assert.ok(await page.evaluate(() => window.__aiTerminated > 0));
  await page.locator("[data-tool=ai]").click();
  await page.evaluate(() => (window.__aiMode = "wait"));
  await page.getByRole("button", { name: "Load free AI", exact: true }).click();
  await page
    .getByRole("button", { name: "Cancel download", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load free AI", exact: true })
    .waitFor();
  await page.evaluate(() => (window.__aiMode = "error"));
  await page.getByRole("button", { name: "Load free AI", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "The local model could not finish" })
    .waitFor();
  assert.deepEqual((await stored()).data, original.data);
  console.log(
    "pass: cancellation, worker cleanup and failure preserve the document",
  );
  await page.evaluate(async () => {
    await caches.open("cv-studio-ai-v1");
    await caches.open("cv-test-keep");
  });
  await page
    .getByText("Privacy, downloads, and storage", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove downloaded model files", exact: true })
    .click();
  await page
    .getByText("Model files removed. Your documents are unchanged.", {
      exact: true,
    })
    .waitFor();
  const cachesLeft = await page.evaluate(() => caches.keys());
  assert.ok(!cachesLeft.includes("cv-studio-ai-v1"));
  assert.ok(cachesLeft.includes("cv-test-keep"));
  assert.deepEqual((await stored()).data, original.data);
  await page.setViewportSize({ width: 320, height: 740 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  assert.equal(overflow, false, "AI drawer must fit a small phone");
  const sourceBox = await page.getByTestId("ai-source").boundingBox();
  assert.ok(sourceBox.x >= 0 && sourceBox.x + sourceBox.width <= 320);
  await page
    .getByTestId("ai-source")
    .fill("Responsible for preparing weekly reports.");
  console.log("pass: optional AI panel and text inputs fit a 320px phone");
  assert.deepEqual(errors, []);
  console.log(
    "pass: model-cache removal leaves documents and unrelated caches intact; no runtime errors",
  );
} finally {
  await browser.close();
}
