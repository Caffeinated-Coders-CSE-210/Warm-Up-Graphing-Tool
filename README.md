# Warm-Up-Graphing-Tool

A small, dependency-free CSV plotting website with linked line and scatter plots.
Open `index.html` in a browser, or serve this folder with any static web server.

## Quick start

1. Clone or download this repository and open its folder. No install or build step is needed.
2. Open `index.html` directly in a browser. Click **Import CSV** and select `sample.csv`
   from the same folder. Both charts should show six points, from `(1,3)` to `(6,10)`.
3. To run the unit tests, install Node.js 24, open a terminal in the repository root,
   and run `node --test tests/*.test.cjs`.

These steps were verified from a fresh checkout with Node.js **v24.22.1** and
Microsoft Edge on Windows, including opening the page through a local `file:` URL.

## Use

- Import a CSV with the header `x,y` and two finite numbers per row, or add points manually.
- Hover or focus a point to see its original values. Click it to review deletion; Cancel or Escape keeps the point.
- Switch X and Y independently between linear and base-10 logarithmic scales. Log scale spreads out values across orders of magnitude.
- An axis containing zero or negative values stays linear; the page explains why its log button is disabled. Adding or importing such values resets that axis to linear without removing any points. The other axis keeps its selected scale.
- Choose PNG, JPEG, or SVG below either chart and click **Export image**. The download includes the chart title, current scales, labels, and points on a white background. PNG and JPEG are 960 by 664 pixels; SVG remains scalable.

All processing and image exports happen locally in the browser. Refreshing clears the data.
Scientific notation is accepted. Tick labels remain finite for very large values, and very small or constant datasets keep valid coordinates.

## How plotting works

```mermaid
flowchart TD
  CSV[CSV import] -->|parseCSV validates all rows, then replaces data| P[points]
  Add[Manual addition] -->|append a valid point| P
  Delete[Confirmed deletion] -->|remove the selected point| P
  P --> R[render]
  Settings[X and Y scale settings] --> R
  R -->|sort points by X and draw both charts| D[drawChart]
  Helpers["scale.js: createAxis and formatTick"] -->|coordinates and tick labels| D
  D --> SVG[Line and scatter SVGs]
  SVG --> Image[chartImage: copy styles, title and white background]
  Image --> Download[SVG download]
  Image --> Raster[rasterImage: canvas conversion]
  Raster --> PNG[PNG or JPEG download]
```

Start in `app.js` for input handlers, the shared `points` array, `render()`,
`drawChart()`, and export. Use `scale.js` for axis calculations and tick labels.
`render()` also resets unsupported log scales and updates the controls before
drawing. An invalid CSV leaves the current data unchanged; canceling deletion
does not change `points`.

`tests/scale.test.cjs` checks numerical helpers without opening a browser.
The shared test command also discovers other `tests/*.test.cjs` files as they
are added. It does not verify file input, chart interactions, or downloads.
Check those separately in the browser: import `sample.csv`, add a point,
cancel and confirm deletion, toggle a scale, and export an image.

## Files

- `index.html`: page controls and chart containers.
- `style.css`: layout and chart appearance.
- `scale.js`: numeric scaling and tick formatting.
- `app.js`: CSV input, chart interactions, and image export.
- `sample.csv`: example dataset.

## Numeric regression checks

With Node.js 24 installed, run `node --test tests/*.test.cjs` from the repository root.
No dependencies or build step are required to use the website.
