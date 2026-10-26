const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { parseCSV } = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "../csv.js"), "utf8") + "; ({ parseCSV });"
);

test("CSV errors retain physical line numbers after leading blank lines", () => {
  for (const newline of ["\n", "\r\n", "\r"]) {
    const csv = ["", "", "x,y", "1,1", "10,oops"].join(newline);
    assert.throws(() => parseCSV(csv), /Row 5\b/);
  }
});
