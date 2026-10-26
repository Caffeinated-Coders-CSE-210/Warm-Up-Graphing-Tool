const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { parseCSV } = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "../csv.js"), "utf8") + "; ({ parseCSV });"
);

// Copy points out of the VM context so deepEqual compares plain objects.
const parse = (text) => Array.from(parseCSV(text), ({ x, y }) => ({ x, y }));

test("CSV errors retain physical line numbers after leading blank lines", () => {
  for (const newline of ["\n", "\r\n", "\r"]) {
    const csv = ["", "", "x,y", "1,1", "10,oops"].join(newline);
    assert.throws(() => parseCSV(csv), /Row 5\b/);
  }
});

test("valid numeric rows parse, including signs, decimals, and scientific notation", () => {
  assert.deepEqual(parse("x,y\n1,2\n-3.5,+4\n.5,1.\n1.5e3,-2E-2\n1e308,-1e-300"), [
    { x: 1, y: 2 },
    { x: -3.5, y: 4 },
    { x: 0.5, y: 1 },
    { x: 1500, y: -0.02 },
    { x: 1e308, y: -1e-300 }
  ]);
});

test("spaces, tabs, quotes, and blank lines around data are ignored", () => {
  assert.deepEqual(parse(" X , Y \n 1 , 2 \n\n\t3\t,\t4\t\n   \n\"5\",\"6\"\n\n"), [
    { x: 1, y: 2 },
    { x: 3, y: 4 },
    { x: 5, y: 6 }
  ]);
  assert.deepEqual(parse("\"x\",\"y\"\n1,2"), [{ x: 1, y: 2 }]);
});

test("LF, CRLF, CR, and mixed line endings give the same points", () => {
  const expected = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
  for (const csv of ["x,y\n1,2\n3,4\n", "x,y\r\n1,2\r\n3,4\r\n", "x,y\r1,2\r3,4\r", "x,y\r\n1,2\n3,4\r"]) {
    assert.deepEqual(parse(csv), expected);
  }
});

test("a byte-order mark before the header is accepted", () => {
  assert.deepEqual(parse("﻿x,y\n1,2"), [{ x: 1, y: 2 }]);
});

test("missing or incorrect headers are rejected", () => {
  for (const csv of ["1,2\n3,4", "x\n1", "x,y,z\n1,2,3", "y,x\n1,2", "a,b\n1,2", "x;y\n1;2"]) {
    assert.throws(() => parseCSV(csv), /header must be x,y/, JSON.stringify(csv));
  }
});

test("empty files and files with only a header are rejected", () => {
  for (const csv of ["", "\n\n", "  \r\n\t"]) {
    assert.throws(() => parseCSV(csv), /header must be x,y/);
  }
  for (const csv of ["x,y", "x,y\n", "x,y\n\n  \n"]) {
    assert.throws(() => parseCSV(csv), /no data points/);
  }
});

test("rows with missing or extra columns are rejected", () => {
  for (const row of ["1", "1,", ",2", "1,2,3", "1,2,", "1;2", "\"1,000\",2"]) {
    assert.throws(() => parseCSV(`x,y\n${row}`), /Row 2 must contain exactly two valid numbers/, row);
  }
});

test("invalid and overflowing numbers are rejected", () => {
  for (const cell of ["abc", "1.2.3", "0x10", "1e", "e5", "--1", "1 000", "Infinity", "-Infinity", "NaN", "1e309", "-1e309"]) {
    assert.throws(() => parseCSV(`x,y\n${cell},1`), /Row 2\b/, cell);
    assert.throws(() => parseCSV(`x,y\n1,${cell}`), /Row 2\b/, cell);
  }
});

test("error line numbers count the header and blank lines in the middle of the file", () => {
  assert.throws(() => parseCSV("x,y\nbad,1"), /Row 2\b/);
  for (const newline of ["\n", "\r\n", "\r"]) {
    const csv = ["x,y", "1,2", "", "", "3,4", "5,6,7"].join(newline);
    assert.throws(() => parseCSV(csv), /Row 6\b/);
  }
  // The first invalid row is the one reported.
  assert.throws(() => parseCSV("x,y\n1,2\n1e309,1\nabc,1"), /Row 3\b/);
});
