const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { parsePointInput, editPoint } = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "../points.js"), "utf8") + "; ({ parsePointInput, editPoint });"
);

const invalidMessage = { message: "Enter valid numbers for X and Y." };

test("parsePointInput returns finite values unchanged", () => {
  for (const [x, y] of [[3, 7], [-2.5, 0], [0, -1e-9], [1e300, -0.125]]) {
    assert.deepEqual({ ...parsePointInput(x, y) }, { x, y });
  }
});

test("parsePointInput rejects empty, non-finite, and missing values", () => {
  for (const [x, y] of [[NaN, 1], [1, NaN], [Infinity, 1], [1, -Infinity], [undefined, 1], [1]]) {
    assert.throws(() => parsePointInput(x, y), invalidMessage);
  }
});

test("editPoint updates only the selected object among identical coordinates", () => {
  const first = { x: 1, y: 1 };
  const twin = { x: 1, y: 1 };
  const points = [first, twin];
  assert.equal(editPoint(points, twin, { x: 4, y: 9 }), true);
  assert.equal(points[1], twin); // Same object, changed in place.
  assert.deepEqual(points, [{ x: 1, y: 1 }, { x: 4, y: 9 }]);
});

test("editPoint leaves the data unchanged when the point is not in it", () => {
  const points = [{ x: 1, y: 2 }];
  const stranger = { x: 1, y: 2 };
  assert.equal(editPoint(points, stranger, { x: 5, y: 5 }), false);
  assert.deepEqual(points, [{ x: 1, y: 2 }]);
  assert.deepEqual(stranger, { x: 1, y: 2 });
});

test("rejected input never reaches the original point", () => {
  const point = { x: 2, y: 3 };
  const points = [point];
  assert.throws(() => editPoint(points, point, parsePointInput(NaN, 8)), invalidMessage);
  assert.deepEqual(points, [{ x: 2, y: 3 }]);
});
