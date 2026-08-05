# @ruplot — Benchmark-driven React bindings for uPlot

> Fast. Typed. Measurable. Not another thin wrapper.

**ruplot** is a production-grade React 19 integration for [uPlot](https://github.com/leeoniya/uPlot): immutable declarative API on the outside, mutable zero-churn engine on the inside — with a public benchmark suite that compares us against `uplot-react`, `react-uplot`, and raw uPlot on every release.

[![CI](https://img.shields.io/github/actions/workflow/status/Avoronov93/react-uplot-core/ci.yml?label=CI)](https://github.com/Avoronov93/react-uplot-core/actions)
[![Benchmarks](https://img.shields.io/badge/benchmarks-CI%20gated-0ea5e9)](./packages/benchmarks)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## Why this exists

Existing React wrappers either recreate uPlot too often or leave update logic to you. ruplot treats performance as a product feature:

1. **Zero unnecessary React renders** — cursor / scales / selection live in external stores, not Context state.
2. **Zero unnecessary uPlot recreations** — classified option diffs → `setData` / `setSize` / `setScale` / `setSeries` / **`patchSeries`** (stroke/width) / recreate.
3. **Benchmark-driven** — reproducible Playwright harness; results published in this README on release; regressions surface in CI.

## Packages

| Package | Role |
| --- | --- |
| [`@ruplot/core`](./packages/core) | Framework-agnostic engine: session, command bus, option classifier, stores |
| [`@ruplot/react`](./packages/react) | `<Chart>`, hooks, SSR-safe React 19 bridge |

## Quick start

```bash
pnpm add @ruplot/react uplot
```

Published on npm: **`@ruplot/react`** + **`@ruplot/core`** ([npm org `ruplot`](https://www.npmjs.com/org/ruplot)).

Live demos: [Storybook](https://avoronov93.github.io/react-uplot-core/)

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

Hooks (subscribe only when you need UI — the chart itself does not re-render on cursor move):

```tsx
const chart = useUPlot();
const idx = useCursor((c) => c.idx);
const x = useScales((s) => s.x);
```

### Composition

```tsx
<Chart.SyncGroup id="plant">
  <Chart data={a} options={optsA}>
    <Chart.Brush value={range} onChange={setRange} panBand grips />
    <Chart.Legend />
    <Chart.Tooltip>{({ idx }) => (idx != null ? <span>{idx}</span> : null)}</Chart.Tooltip>
  </Chart>
  <Chart data={b} options={optsB} />
</Chart.SyncGroup>
```

**Update highlights:** `stroke` / `width` / `dash` / `fill` → `patchSeries` (same instance). `hooks` and axis formatters (`values`, `label`, …) are slotted — identity changes do not remount uPlot. Structural changes (`series.paths`, axis `side`, plugins list) → recreate with runtime restore.

## Demos

Interactive examples: [Storybook](https://avoronov93.github.io/react-uplot-core/) — streaming, brush, sync, plugins, large data, and more.

## Architecture (short)

```
React props ──► classify ──► commands ──► ChartSession ──► uPlot
                 │                              │
                 │                              ├── stores (cursor/scales/…)
                 │                              └── pooled scratch objects
                 └── identity → value → targeted deep
```

## Benchmarks

**Compared libraries:** raw uPlot · [`uplot-react`](https://www.npmjs.com/package/uplot-react) · [`react-uplot`](https://www.npmjs.com/package/react-uplot) · **@ruplot/react**

### Latest snapshot

<!-- BENCH:START -->
| Metric | baseline | uplot-react | react-uplot | **ruplot** |
| --- | --- | --- | --- | --- |
| stream-60 FPS | 59.1 | 59.0 | 59.1 | **59.1** |
| stream React commits | 0 | 119 | 119 | **0** |
<!-- BENCH:END -->

## Streaming demo

![ruplot 60Hz streaming with near-zero React commits](./docs/media/streaming.gif)

## Large data

![static](./docs/media/large-static.gif) ![dynamic zoom](./docs/media/large-dynamic.gif)

## License

MIT
