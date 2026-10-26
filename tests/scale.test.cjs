const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createAxis, formatTick } = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "../scale.js"), "utf8") + "; ({ createAxis, formatTick });"
);

test("ordinary linear axes map values and ticks evenly, including negative ranges", () => {
  for (const [min, max, ticks] of [
    [0, 100, [0, 25, 50, 75, 100]],
    [-10, 10, [-10, -5, 0, 5, 10]],
    [-8, -4, [-8, -7, -6, -5, -4]]
  ]) {
    const axis = createAxis(min, max);
    assert.deepEqual([...axis.tickRatios.map(axis.tick)], ticks);
    ticks.forEach((value, i) => assert.equal(axis.position(value), i / 4));
  }
});

test("linear positions outside the axis are clamped to its edges", () => {
  const axis = createAxis(-10, 10);
  assert.equal(axis.position(-20), 0);
  assert.equal(axis.position(20), 1);
});

test("ticks increase strictly across ordinary, tiny, and huge ranges", () => {
  for (const [min, max, logarithmic] of [
    [1e-10, 5e-10],
    [-3e300, 1e300],
    [1e-300, 1e300, true],
    [2, 2000, true]
  ]) {
    const axis = createAxis(min, max, logarithmic);
    const ticks = axis.tickRatios.map(axis.tick);
    ticks.slice(1).forEach((value, i) => assert.ok(value > ticks[i], `${ticks[i]} < ${value}`));
  }
});

test("log axes place geometric midpoints at the center of non-decade ranges", () => {
  const axis = createAxis(2, 2000, true);
  assert.ok(Math.abs(axis.tick(0.5) - Math.sqrt(2 * 2000)) < 1e-9);
  assert.ok(Math.abs(axis.position(Math.sqrt(2 * 2000)) - 0.5) < 1e-12);
  assert.ok(Math.abs(axis.position(20) - 1 / 3) < 1e-12);
});

test("narrow ranges keep distinct tick values", () => {
  // Label formatting for these ranges is covered by the tick-label fix (fix/axis-labels).
  for (const [min, max] of [[1000, 1001], [1.0001, 1.0002], [-1e-9, 1e-9]]) {
    const axis = createAxis(min, max);
    const ticks = axis.tickRatios.map(axis.tick);
    assert.equal(new Set(ticks).size, ticks.length);
    assert.ok(Math.abs(axis.position(ticks[2]) - 0.5) < 1e-9);
  }
});

test("rounded labels never overflow to Infinity", () => {
  for (const value of [Number.MAX_VALUE, -Number.MAX_VALUE, 1.797e308, Number.MIN_VALUE, 0]) {
    assert.doesNotMatch(formatTick(value), /Infinity|NaN/);
  }
  assert.equal(formatTick(Number.MAX_VALUE), "1.8e+308");
  assert.equal(formatTick(1.2), "1.2");
  assert.equal(formatTick(100), "100");
});

test("linear axes handle extreme spans, subnormal values, and close values", () => {
  for (const [min, max] of [
    [-Number.MAX_VALUE, Number.MAX_VALUE],
    [0, Number.MIN_VALUE],
    [-Number.MIN_VALUE, Number.MIN_VALUE],
    [Number.MIN_VALUE, 2 * Number.MIN_VALUE],
    [1.7976931348623155e308, Number.MAX_VALUE],
    [-10, -2]
  ]) {
    const axis = createAxis(min, max);
    assert.equal(axis.position(min), 0);
    assert.equal(axis.position(max), 1);
    for (const ratio of axis.tickRatios) {
      const value = axis.tick(ratio);
      assert.ok(Number.isFinite(value));
      assert.ok(Number.isFinite(axis.position(value)));
      assert.ok(value >= min && value <= max);
      assert.doesNotMatch(formatTick(value), /Infinity|NaN/);
    }
  }
});

test("constant axes center points, including zero and floating-point limits", () => {
  for (const value of [0, Number.MIN_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE]) {
    const axis = createAxis(value, value);
    assert.equal(axis.position(value), 0.5);
    assert.equal(axis.tick(0.5), value);
    assert.equal(axis.tickRatios.length, 1);
    if (value > 0) assert.equal(createAxis(value, value, true).position(value), 0.5);
  }
});

test("log axes space orders of magnitude evenly and preserve raw tick values", () => {
  const axis = createAxis(1, 10000, true);
  [1, 10, 100, 1000, 10000].forEach((value, i) => {
    assert.equal(axis.position(value), i / 4);
    assert.equal(axis.tick(i / 4), value);
  });
});

test("log axes remain finite across the full positive numeric range", () => {
  for (const [min, max] of [
    [Number.MIN_VALUE, Number.MAX_VALUE],
    [1.7976931348623155e308, Number.MAX_VALUE],
    [Number.MIN_VALUE, 2 * Number.MIN_VALUE]
  ]) {
    const axis = createAxis(min, max, true);
    assert.equal(axis.position(min), 0);
    assert.equal(axis.position(max), 1);
    assert.equal(axis.tick(0), min);
    assert.equal(axis.tick(1), max);
    for (const ratio of axis.tickRatios) {
      assert.ok(Number.isFinite(axis.tick(ratio)));
      assert.ok(axis.tick(ratio) > 0);
      assert.ok(Number.isFinite(axis.position(axis.tick(ratio))));
    }
  }
});

test("invalid bounds and nonpositive logarithmic domains are rejected", () => {
  for (const bounds of [[-1, 1, true], [0, 1, true], [Infinity, Infinity], [NaN, 1], [2, 1]]) {
    assert.throws(() => createAxis(...bounds));
  }
});

test("each invalid bound is rejected with the matching message", () => {
  for (const bounds of [[1, NaN], [NaN, NaN], [-Infinity, 1], [1, Infinity], [-1, -2], [1, 0.5, true]]) {
    assert.throws(() => createAxis(...bounds), /finite and ordered/);
  }
  for (const bounds of [[-10, -1], [0, 0], [-5, -5], [-Number.MIN_VALUE, 1]]) {
    assert.throws(() => createAxis(...bounds, true), /requires positive values/);
  }
});
