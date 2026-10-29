// Exploratory measurements for issue #11 (title: Issue 9), not a CI benchmark.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const output = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "graphing-performance-")));
const channel = process.env.BROWSER_CHANNEL || "msedge";
const sizes = [100, 1000, 10000];
const round = value => Math.round(value * 10) / 10;

// Observe real input events and status updates without replacing application functions.
async function arm(page, kind) {
  await page.evaluate(kind => {
    const selector = kind === "import" ? "#csv-file" : kind === "add" ? "#point-form" : '[data-chart="scatter"]';
    const event = kind === "import" ? "change" : kind === "add" ? "submit" : "click";
    const status = document.querySelector(kind === "export" ? "#export-status" : "#status");
    const expectedPrefix = kind === "import" ? "Imported " : kind === "add" ? "Added " : "Exported ";
    const timing = window.measurement = { done: false, start: null, maxFrameGapMs: 0 };
    document.querySelector(selector).addEventListener(event, () => {
      timing.start = performance.now();
      let previous = timing.start;
      function frame() {
        const now = performance.now();
        timing.maxFrameGapMs = Math.max(timing.maxFrameGapMs, now - previous);
        previous = now;
        if (!timing.done) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      const observer = new MutationObserver(() => {
        if (status.classList.contains("error")) {
          timing.error = status.textContent;
          timing.done = true;
          observer.disconnect();
        } else if (status.textContent.startsWith(expectedPrefix)) {
          timing.statusMs = performance.now() - timing.start;
          observer.disconnect();
          // Two frame callbacks allow a paint opportunity after both SVGs update.
          requestAnimationFrame(() => requestAnimationFrame(() => {
            timing.twoFramesMs = performance.now() - timing.start;
            timing.done = true;
          }));
        }
      });
      observer.observe(status, { childList: true, subtree: true, characterData: true });
    }, { capture: true, once: true });
  }, kind);
}

async function finish(page) {
  await page.waitForFunction(() => window.measurement.done, null, { timeout: 120000 });
  const timing = await page.evaluate(() => window.measurement);
  assert.equal(timing.error, undefined, timing.error);
  return Object.fromEntries(Object.entries(timing).filter(([key]) => key.endsWith("Ms")).map(([key, value]) => [key, round(value)]));
}

async function validateCharts(page, count) {
  const problems = await page.evaluate(count => {
    const problems = [];
    for (const id of ["line-chart", "scatter-chart"]) {
      const nodes = document.querySelectorAll(`#${id} .point`);
      if (nodes.length !== count) problems.push(`${id}: ${nodes.length} points, expected ${count}`);
      nodes.forEach((node, index) => {
        const value = index + 1;
        const x = Number(node.getAttribute("cx")), y = Number(node.getAttribute("cy"));
        const expectedX = 84 + index / (count - 1) * 354;
        const expectedY = 252 - index / (count - 1) * 232;
        if (!node.getAttribute("aria-label").startsWith(`X: ${value}, Y: ${value};`) ||
            !Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x - expectedX) > 1e-6 || Math.abs(y - expectedY) > 1e-6) {
          problems.push(`${id}: incorrect value or position at point ${value}`);
        }
      });
    }
    const line = document.querySelector("#line-chart polyline");
    if (!line || line.getAttribute("points").trim().split(/\s+/).length !== count) problems.push("Incomplete polyline");
    return problems;
  }, count);
  assert.deepEqual(problems, []);
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  for (const size of sizes) {
    const csv = "x,y\n" + Array.from({ length: size }, (_, i) => `${i + 1},${i + 1}`).join("\n") + "\n";
    fs.writeFileSync(path.join(output, `points-${size}.csv`), csv);
  }
  const browser = await chromium.launch({ channel, headless: true });
  const report = {
    measuredAt: new Date().toISOString(),
    applicationCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    environment: {
      os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model,
      logicalCPUs: os.cpus().length, memoryGiB: round(os.totalmem() / 1024 ** 3),
      node: process.version, playwright: require("playwright/package.json").version,
      browser: browser.version(), channel, headless: true,
      viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1,
      page: "local file URL", scales: "X linear, Y linear", repetitions: 3
    },
    trials: []
  };
  try {
    // Fixed ascending size order. Every repetition starts in a new context/page.
    for (const size of sizes) {
      for (let repetition = 1; repetition <= 3; repetition++) {
        const context = await browser.newContext({ viewport: report.environment.viewport, deviceScaleFactor: 1 });
        const page = await context.newPage();
        page.setDefaultTimeout(120000);
        const trial = { points: size, repetition, pageErrors: [] };
        page.on("pageerror", error => trial.pageErrors.push(error.message));
        report.trials.push(trial);
        try {
          await page.goto(pathToFileURL(path.join(root, "index.html")).href);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          await arm(page, "import");
          await page.locator("#csv-file").setInputFiles(path.join(output, `points-${size}.csv`));
          trial.import = await finish(page);
          await validateCharts(page, size);

          await page.locator("#x-input").fill(String(size + 1));
          await page.locator("#y-input").fill(String(size + 1));
          await arm(page, "add");
          await page.getByRole("button", { name: "Add point", exact: true }).click();
          trial.add = await finish(page);
          await validateCharts(page, size + 1);

          await page.locator("#scatter-format").selectOption("png");
          await arm(page, "export");
          const ready = page.waitForEvent("download").then(async download => ({
            download,
            // Read the browser clock immediately on download notification; includes a protocol round trip.
            availableMs: await page.evaluate(() => performance.now() - window.measurement.start)
          }));
          await page.getByRole("button", { name: "Export scatter plot image", exact: true }).click();
          const { download, availableMs } = await ready;
          trial.export = { ...await finish(page), downloadAvailableMs: round(availableMs) };
          const filename = `scatter-${size}-run-${repetition}.png`;
          await download.saveAs(path.join(output, filename));
          assert.equal(await download.failure(), null);
          const png = fs.readFileSync(path.join(output, filename));
          assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
          assert.equal(png.readUInt32BE(16), 960);
          assert.equal(png.readUInt32BE(20), 664);
          trial.export.file = filename;
          trial.export.bytes = png.length;
          trial.validatedPointsPerChart = size + 1;
          assert.deepEqual(trial.pageErrors, []);
          if (repetition === 1) await page.screenshot({ path: path.join(output, `charts-${size}.png`), fullPage: true });
          console.log(JSON.stringify(trial));
        } catch (error) {
          trial.failure = error.message;
          throw error;
        } finally {
          fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(report, null, 2) + "\n");
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
    console.log(`Evidence saved to ${output}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
