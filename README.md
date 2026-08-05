# ruplot

**React bindings for [uPlot](https://github.com/leeoniya/uPlot) that stay out of the way of the frame budget.**

At 60Hz streaming, typical wrappers commit React ~100+ times. **ruplot commits 0** — same FPS as raw uPlot.

[![npm](https://img.shields.io/npm/v/@ruplot/react?label=%40ruplot%2Freact)](https://www.npmjs.com/package/@ruplot/react)
[![CI](https://img.shields.io/github/actions/workflow/status/Avoronov93/react-uplot-core/ci.yml?label=CI)](https://github.com/Avoronov93/react-uplot-core/actions)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785)](https://avoronov93.github.io/react-uplot-core/)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

```bash
pnpm add @ruplot/react uplot
```

**Live demos:** [Storybook](https://avoronov93.github.io/react-uplot-core/) · Packages: [`@ruplot/react`](https://www.npmjs.com/package/@ruplot/react) · [`@ruplot/core`](https://www.npmjs.com/package/@ruplot/core)

![60Hz streaming — ruplot keeps React quiet](./docs/media/streaming.gif)

---

## Why not just wrap uPlot?

Most React wrappers either:

- recreate the chart on option changes you thought were “cheap”, or
- push cursor / scales through React state and blow the commit budget while streaming.

ruplot does both sides deliberately:

| | raw uPlot | uplot-react | react-uplot | **ruplot** |
| --- | ---: | ---: | ---: | ---: |
| stream-60 **FPS** | 59.1 | 59.0 | 59.1 | **59.1** |
| stream React **commits** | 0 | 119 | 119 | **0** |

Same paint speed. Far less React work. Measured in CI on every release.

---

## Quick start

```tsx
import { Chart } from "@ruplot/react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

const options: uPlot.Options = {
  width: 800,
  height: 300,
  series: [{}, { label: "Signal", stroke: "#0ea5e9" }],
};

export function App({ data }: { data: uPlot.AlignedData }) {
  return <Chart data={data} options={options} />;
}
```

Subscribe only when *your* UI needs it — moving the cursor does not re-render the chart tree:

```tsx
const idx = useCursor((c) => c.idx);
const x = useScales((s) => s.x);
```

### Brush, tooltip, sync

```tsx
<Chart.SyncGroup id="plant">
  <Chart data={a} options={optsA}>
    <Chart.Brush value={range} onChange={setRange} panBand grips />
    <Chart.Legend />
    <Chart.Tooltip>
      {({ idx }) => (idx != null ? <span>{idx}</span> : null)}
    </Chart.Tooltip>
  </Chart>
  <Chart data={b} options={optsB} />
</Chart.SyncGroup>
```

Also: `Chart.AutoSize`, plugins, streaming helpers (`useBrushStreamPolicy`).

---

## What updates without remounting

| Change | What ruplot does |
| --- | --- |
| `data` | `setData` |
| `stroke` / `width` / `dash` / `fill` | `patchSeries` (same uPlot instance) |
| size | `setSize` |
| axis `values` / `label` (formatters) | slotted — no remount |
| `series.paths`, axis `side`, plugin list | recreate + restore zoom/cursor |

You keep a declarative `options` object; the classifier picks the cheapest safe path.

---

## Large data

![static pan/zoom](./docs/media/large-static.gif)
![dynamic zoom](./docs/media/large-dynamic.gif)

More scenes in [Storybook](https://avoronov93.github.io/react-uplot-core/): streaming, brush + live lock, sync groups, workers, SSR hydrate.

---

## Packages

| Package | Use when |
| --- | --- |
| [`@ruplot/react`](https://www.npmjs.com/package/@ruplot/react) | React apps — start here |
| [`@ruplot/core`](https://www.npmjs.com/package/@ruplot/core) | Non-React hosts / custom bindings |

---

## How it works (one picture)

```
React props ──► classify ──► commands ──► ChartSession ──► uPlot
                 │                              │
                 │                              ├── stores (cursor / scales / …)
                 │                              └── no Context re-renders for 60Hz paths
                 └── identity → value → targeted patch / recreate
```

---

## License

MIT
