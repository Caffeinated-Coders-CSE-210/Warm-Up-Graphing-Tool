// Validate edited coordinates; inputs come from number fields as valueAsNumber.
function parsePointInput(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("Enter valid numbers for X and Y.");
  }
  return { x, y };
}

// Update the selected object in place so identical coordinates remain separate points.
function editPoint(points, point, values) {
  if (points.indexOf(point) === -1) return false;
  Object.assign(point, values);
  return true;
}
