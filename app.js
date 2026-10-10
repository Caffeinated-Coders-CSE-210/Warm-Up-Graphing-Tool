// The single data source: each object is a point, such as { x: 1, y: 3 }.
let points = [];
const fileInput = document.querySelector("#csv-file");
const importButton = document.querySelector("#import-button");
const form = document.querySelector("#point-form");
const xInput = document.querySelector("#x-input");
const yInput = document.querySelector("#y-input");
const status = document.querySelector("#status");
const tooltip = document.querySelector("#point-tooltip");
const deleteDialog = document.querySelector("#delete-dialog");
const deleteMessage = document.querySelector("#delete-message");
let pointToDelete = null;

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

// This example accepts two numeric columns, x and y, rather than arbitrary CSV.
function parseCSV(text) {
  const lines = text.trim().split(/\r\n|\n|\r/);
  const readCells = (line) => line.split(",").map((cell) =>
    cell.trim().replace(/^"([^"]*)"$/, "$1").trim()
  );
  if (readCells(lines[0]).join(",").toLowerCase() !== "x,y") {
    throw new Error("The CSV header must be x,y.");
  }

  const result = [];
  const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip blank lines.
    const cells = readCells(lines[i]);
    if (cells.length !== 2 || cells.some((cell) =>
      !numberPattern.test(cell) || !Number.isFinite(Number(cell))
    )) {
      throw new Error(`Row ${i + 1} must contain exactly two valid numbers.`);
    }
    result.push({ x: Number(cells[0]), y: Number(cells[1]) });
  }
  if (result.length === 0) throw new Error("The CSV contains no data points.");
  return result;
}

importButton.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  importButton.disabled = true;
  try {
    const text = await file.text(); // Read the local file without uploading it.
    points = parseCSV(text); // Replace data only after every row is valid.
    render();
    showStatus(`Imported ${file.name}. Points: ${points.length}.`);
  } catch (error) {
    showStatus(error instanceof DOMException ? "Unable to read this file." : error.message, true);
  } finally {
    fileInput.value = ""; // Allow selecting the same file again.
    importButton.disabled = false;
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault(); // Keep form submission from refreshing the page.
  const x = xInput.valueAsNumber;
  const y = yInput.valueAsNumber;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    showStatus("Enter valid numbers for X and Y.", true);
    return;
  }
  points.push({ x, y });
  render();
  showStatus(`Added (${x}, ${y}). Points: ${points.length}.`);
  form.reset();
  xInput.focus();
});

function hideTooltip() {
  tooltip.hidden = true;
}

function showTooltip(circle, point) {
  if (deleteDialog.open) return;
  tooltip.textContent = `X: ${point.x}\nY: ${point.y}`;
  tooltip.hidden = false;
  const anchor = circle.getBoundingClientRect();
  const box = tooltip.getBoundingClientRect();
  // Prefer the right side of the point; flip left near the window edge.
  let left = anchor.right + 10;
  if (left + box.width > window.innerWidth - 8) left = anchor.left - box.width - 10;
  const top = anchor.top + (anchor.height - box.height) / 2;
  tooltip.style.left = `${Math.max(8, Math.min(left, window.innerWidth - box.width - 8))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(top, window.innerHeight - box.height - 8))}px`;
}

window.addEventListener("scroll", hideTooltip, true);
window.addEventListener("resize", hideTooltip);

function requestDelete(point) {
  pointToDelete = point;
  deleteMessage.textContent = `Remove X: ${point.x}, Y: ${point.y} from both charts?`;
  deleteDialog.returnValue = ""; // Escape must never reuse an earlier confirmation.
  hideTooltip();
  deleteDialog.showModal();
}

deleteDialog.addEventListener("close", () => {
  if (deleteDialog.returnValue === "confirm") {
    // Match the object itself so identical coordinates remain separate points.
    const index = points.indexOf(pointToDelete);
    if (index !== -1) {
      points.splice(index, 1);
      render();
      showStatus(`Point deleted. Points: ${points.length}.`);
      xInput.focus();
    }
  }
  pointToDelete = null;
  hideTooltip();
});

// Create SVG elements in the SVG namespace.
function svgElement(tag, attributes, text = "") {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  element.textContent = text;
  return element;
}

function dataRange(key) {
  let min = points[0][key];
  let max = min;
  for (const point of points) {
    min = Math.min(min, point[key]);
    max = Math.max(max, point[key]);
  }
  // Give constant values a nonzero axis range to avoid division by zero.
  if (min === max) {
    if (min === 0) return [-1, 1];
    return min > 0 ? [min / 2, max] : [min, max / 2];
  }
  return [min, max];
}

function drawChart(svg, connectPoints) {
  svg.replaceChildren();
  if (points.length === 0) {
    svg.append(svgElement("text", { x: 240, y: 150, "text-anchor": "middle" }, "Import a CSV or add a point"));
    return;
  }

  // Use fixed SVG coordinates; CSS scales the chart to fit its container.
  const left = 76, right = 458, top = 20, bottom = 252;
  const [xMin, xMax] = dataRange("x");
  const [yMin, yMax] = dataRange("y");
  const fraction = (value, min, max) => (value / 2 - min / 2) / (max / 2 - min / 2);
  const scaleX = (x) => left + fraction(x, xMin, xMax) * (right - left);
  const scaleY = (y) => bottom - fraction(y, yMin, yMax) * (bottom - top);
  const format = (value) => String(Number(value.toPrecision(3)));

  // Draw five sets of tick labels and horizontal grid lines.
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    const x = left + ratio * (right - left);
    const y = bottom - ratio * (bottom - top);
    svg.append(
      svgElement("line", { x1: left, y1: y, x2: right, y2: y, class: "grid" }),
      svgElement("text", { x, y: bottom + 22, "text-anchor": "middle" }, format(xMin * (1 - ratio) + xMax * ratio)),
      svgElement("text", { x: left - 10, y: y + 4, "text-anchor": "end" }, format(yMin * (1 - ratio) + yMax * ratio))
    );
  }
  svg.append(
    svgElement("path", { d: `M ${left} ${top} V ${bottom} H ${right}`, class: "axis" }),
    svgElement("text", { x: (left + right) / 2, y: 296, "text-anchor": "middle" }, "X"),
    svgElement("text", { x: 14, y: 16 }, "Y")
  );

  // The line chart adds a polyline; both chart types share the remaining code.
  if (connectPoints) {
    const coordinates = points.map((point) => `${scaleX(point.x)},${scaleY(point.y)}`).join(" ");
    svg.append(svgElement("polyline", { points: coordinates, class: "line" }));
  }

  points.forEach((point) => {
    const label = `X: ${point.x}, Y: ${point.y}`;
    const circle = svgElement("circle", {
      cx: scaleX(point.x), cy: scaleY(point.y), r: 6, class: "point",
      tabindex: 0, role: "button", "aria-label": `${label}; press Enter to review deletion`
    });
    circle.addEventListener("pointerenter", () => showTooltip(circle, point));
    circle.addEventListener("pointerleave", hideTooltip);
    circle.addEventListener("focus", () => showTooltip(circle, point));
    circle.addEventListener("blur", hideTooltip);
    circle.addEventListener("click", () => requestDelete(point));
    circle.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        requestDelete(point);
      }
    });
    svg.append(circle);
  });
}

function render() {
  hideTooltip();
  points.sort((a, b) => a.x - b.x);
  drawChart(document.querySelector("#line-chart"), true);
  drawChart(document.querySelector("#scatter-chart"), false);
}

render();
showStatus("No data yet. Import a CSV or add a point.");
