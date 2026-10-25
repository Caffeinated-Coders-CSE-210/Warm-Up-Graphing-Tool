// Temporary unmerged demonstration for issue #5; removed after the failed check.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const start = source.indexOf("function parseCSV(text)");
const end = source.indexOf("importButton.addEventListener", start);
const parseCSV = vm.runInNewContext(source.slice(start, end) + "; parseCSV;");

test("CI reports the existing CSV line-number regression (#8)", () => {
  assert.throws(() => parseCSV("\n\nx,y\n1,1\n10,oops"), {
    message: "Row 5 must contain exactly two valid numbers."
  });
});
