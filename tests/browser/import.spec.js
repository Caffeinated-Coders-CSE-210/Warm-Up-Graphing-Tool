const { test, expect } = require("@playwright/test");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const appURL = pathToFileURL(path.join(__dirname, "../../index.html")).href;
const validCSV = { name: "valid.csv", mimeType: "text/csv", buffer: Buffer.from("x,y\n1,1\n10,100\n100,10\n") };
const invalidCSV = { name: "invalid.csv", mimeType: "text/csv", buffer: Buffer.from("x,y\n1,1\n10,oops\n") };

// Both axes run from 1 to 100, which the charts draw from x = 84 to 438 and y = 252 to 20.
const originalPoints = [
  { label: "X: 1, Y: 1", cx: 84, cy: 252 },
  { label: "X: 10, Y: 100", cx: 116.18, cy: 20 },
  { label: "X: 100, Y: 10", cx: 438, cy: 230.91 }
];

// Read each point's values from its label and its SVG position, rounded to two decimals.
function readPoints(page, chart) {
  return page.locator(`${chart} circle`).evaluateAll((circles) => circles.map((circle) => ({
    label: circle.getAttribute("aria-label").split(";")[0],
    cx: Math.round(Number(circle.getAttribute("cx")) * 100) / 100,
    cy: Math.round(Number(circle.getAttribute("cy")) * 100) / 100
  })));
}

test("an invalid CSV shows an error and leaves both charts unchanged", async ({ page }) => {
  const fileInput = page.locator("#csv-file");
  const status = page.locator("#status");
  await page.goto(appURL);

  await fileInput.setInputFiles(validCSV);
  await expect(status).toHaveText("Imported valid.csv. Points: 3.");
  expect(await readPoints(page, "#line-chart")).toEqual(originalPoints);
  expect(await readPoints(page, "#scatter-chart")).toEqual(originalPoints);

  await fileInput.setInputFiles(invalidCSV);
  await expect(status).toHaveText("Row 3 must contain exactly two valid numbers.");
  await expect(status).toHaveClass(/error/);
  expect(await readPoints(page, "#line-chart")).toEqual(originalPoints);
  expect(await readPoints(page, "#scatter-chart")).toEqual(originalPoints);
});
