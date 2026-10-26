// This example accepts two numeric columns, x and y, rather than arbitrary CSV.
function parseCSV(text) {
  const lines = text.split(/\r\n|\n|\r/);
  const headerIndex = lines.findIndex((line) => line.trim());
  const readCells = (line) => line.split(",").map((cell) =>
    cell.trim().replace(/^"([^"]*)"$/, "$1").trim()
  );
  if (headerIndex === -1 || readCells(lines[headerIndex]).join(",").toLowerCase() !== "x,y") {
    throw new Error("The CSV header must be x,y.");
  }

  const result = [];
  const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
  for (let i = headerIndex + 1; i < lines.length; i++) {
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
