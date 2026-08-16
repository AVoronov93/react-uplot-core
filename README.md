# ruplot

**uPlot in React that does not torch your commit budget.**  
60Hz streaming, **0 React commits** on the stream-60 scenario, same FPS as raw canvas — not another React uPlot binding that re-renders the tree on every tick.

Repo `react-uplot-core` → npm [`@ruplot/react`](https://www.npmjs.com/package/@ruplot/react) (start here) + [`@ruplot/core`](https://www.npmjs.com/package/@ruplot/core) (engine).

**React 18+** (19 recommended). No React 19-only APIs on the hot path.

[![npm](https://img.shields.io/npm/v/@ruplot/react?label=%40ruplot%2Freact)](https://www.npmjs.com/package/@ruplot/react)
[![npm](https://img.shields.io/npm/v/@ruplot/core?label=%40ruplot%2Fcore)](https://www.npmjs.com/package/@ruplot/core)
[![CI](https://img.shields.io/github/actions/workflow/status/AVoronov93/react-uplot-core/ci.yml?label=CI)](https://github.com/AVoronov93/react-uplot-core/actions)
[![React 18/19](https://img.shields.io/badge/React-18%20%2F%2019-61dafb)](https://github.com/AVoronov93/react-uplot-core/blob/main/.github/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785)](https://avoronov93.github.io/react-uplot-core/)
[![bundle](https://img.shields.io/badge/bundle-%3C32kB-blue)](./scripts/check-size.mjs)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

```bash
pnpm add @ruplot/react uplot
```

[Live Storybook](https://avoronov93.github.io/react-uplot-core/) · [API tables](https://avoronov93.github.io/react-uplot-core/?path=/docs/01-overview-api--docs) · [See React commits: uplot-react vs ruplot](https://avoronov93.github.io/react-uplot-core/?path=/docs/07-compare-streaming-commits--docs)

![60Hz streaming — ruplot keeps React at 0 commits](./docs/media/streaming.gif)

---

## Who this is for

| You should use ruplot if… | Pick something simpler if… |
| --- | --- |
| Realtime dashboards, telemetry, industrial / trading charts | Static one-shot charts (a PNG or a thin `new uPlot` wrapper is enough) |
| Cursor, scales, or data move **often**, and React commit cost shows up in the profiler | React **&lt; 18** (we need `useSyncExternalStore`) |
| You want uPlot’s canvas speed **inside** React, with Brush / Tooltip / Legend / SyncGroup | The team cannot keep `options` / `data` **stable by reference** on hot paths |

Inline `options={{ … }}` every render is the fastest way to lose the benefit. If that is how the app is written, this library will fight you.

---

## Proof (stream-60)

Most React uPlot wrappers either recreate the chart on cheap option changes, or push cursor / scales through React state. Paint can still look fine — **React pays**.

| | raw uPlot | uplot-react | react-uplot | **ruplot** |
| --- | ---: | ---: | ---: | ---: |
| stream-60 **FPS** | 59.1 | 59.0 | 59.1 | **59.1** |
| stream React **commits** | 0 | 119 | 119 | **0** |

Same paint speed. ~119 fewer React commits on this scenario. Numbers from the **stream-60** lane in CI (`pnpm bench`) — ~2s ingest, FPS from rAF, commits from React Profiler. Open live: [See React commits: uplot-react vs ruplot](https://avoronov93.github.io/react-uplot-core/?path=/docs/07-compare-streaming-commits--docs). Hardware and browser vary; the gap is the point, not the third decimal of FPS.

---

## Quick start

```tsx
import { Chart } from "@ruplot/react";
import type uPlot from "uplot";
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

### Rules on the hot path

1. Keep `options` and `data` **stable by reference** (`useMemo` / module scope).
2. Treat `data` columns as **immutable** — new series ref (or `streamingWindow`). Dev warns on in-place mutation.
3. **Do not** put a 60Hz buffer in `useState`. Keep it in a ref and `setData` on the instance / session.

Cursor HUD without re-rendering the canvas tree:

```tsx
const idx = useCursor((c) => c.idx);
const x = useScales((s) => s.x);
```

---

## Recipes

### Streaming window

```tsx
import { Chart, type ChartRef, streamingWindow } from "@ruplot/react";

<Chart ref={ref} data={data} options={options} streaming={{ enabled: true, follow: true }} />

// 60Hz: mutate a ref buffer, then:
ref.current?.getInstance()?.setData(next, false);
```

`streamingWindow({ buffer, chunk, capacity })` is for slower React-driven windows — not a substitute for a ref at 60Hz. Demo: [03 Updates → Streaming](https://avoronov93.github.io/react-uplot-core/?path=/docs/03-updates-streaming--docs).

### Brush + follow (one owner of X)

```tsx
const { streaming, brush } = useBrushStreamPolicy({ range, setRange, following });

<Chart data={data} options={options} streaming={streaming}>
  <Chart.Brush {...brush} panBand grips />
</Chart>
```

Do not leave `follow: true` and an enabled Brush on the same X scale. Demo: [Brush stream lock](https://avoronov93.github.io/react-uplot-core/?path=/docs/04-composition-brush-stream-lock--docs).

### Synced charts + tooltip / legend

```tsx
<Chart.SyncGroup id="plant">
  <Chart data={a} options={optsA}>
    <Chart.Legend />
    <Chart.Tooltip>
      {({ idx }) => (idx != null ? <span>{idx}</span> : null)}
    </Chart.Tooltip>
  </Chart>
  <Chart data={b} options={optsB} />
</Chart.SyncGroup>
```

### SSR hydrate

uPlot needs a DOM node — **do not mount `<Chart>` on the server**.

```tsx
const stores = createChartStores();

// Server HUD: useSyncExternalStore(sub, getSnapshot, getServerSnapshot)
// Client: <Chart data={data} options={options} stores={stores} />
```

Demo: [SSR hydrate](https://avoronov93.github.io/react-uplot-core/?path=/docs/03-updates-ssr-hydrate--docs).

---

## What updates without remounting

| Change | Path |
| --- | --- |
| `data` (new series refs) | `setData` |
| `stroke` / `width` / `dash` / `fill` / `spanGaps` | `patchSeries` |
| size | `setSize` |
| axis `values` / `label` (formatters) | slotted — no remount |
| `series.paths`, axis `side`, plugin list, `title`, … | **recreate** + restore zoom/cursor |

`<Chart debug />` / `ref.getDebugSnapshot()` shows which path ran. `RUPLOT_DEBUG=1` logs recreate reasons.

---

## Migration (practical)

**From [uplot-react](https://www.npmjs.com/package/uplot-react):** swap the component; map `onCreate` → `onReady`; drop `target`; use `streaming` instead of fighting `resetScales` every tick; move cursor UI to `useCursor` / `Chart.Tooltip`.

```tsx
// before
<UplotReact options={options} data={data} onCreate={onReady} resetScales={false} />

// after
<Chart data={data} options={options} onReady={onReady} streaming={{ enabled: true, follow: true }} />
```

**From [react-uplot](https://www.npmjs.com/package/react-uplot):** same swap. Pull `useState` for hover off the chart parent.

**From raw uPlot:** keep your `options` / `data`; `<Chart>` owns the DOM node and routes diffs through the classifier (`setData` / `setSize` / `patchSeries` / recreate). Escape hatches: `ref.current.getInstance()`, `useUPlot()`, `session.apply(...)`.

Keep `options` stable. Open stream-60 commit comparison: [See React commits: uplot-react vs ruplot](https://avoronov93.github.io/react-uplot-core/?path=/docs/07-compare-streaming-commits--docs).

---

## Stability (0.3)

| Import | Status |
| --- | --- |
| `@ruplot/react` | **stable for 0.x** — Chart, composition (`Brush`, `Tooltip`, `Legend`, `AutoSize`, `SyncGroup`), hooks, common helpers (`streamingWindow`, `createChartStores`, `batchStores`, plugins) |
| `@ruplot/react/unstable` | **unstable until 1.0** — `streamingWindowTransferable`, `createDataWorker`, `createDataPlane`, `rebindSyncGroup` |
| `@ruplot/core` | Engine (`ChartSession`, classifier, stores). Prefer React for apps; import core for custom hosts |

Semver on **0.x**: minors may add; breaking changes to the stable React surface will be called out. Unstable may change without a major. **1.0** = freeze the stable `@ruplot/react` export list (see checklist below).

```ts
import { Chart, streamingWindow } from "@ruplot/react";
import { streamingWindowTransferable } from "@ruplot/react/unstable";
```

### Toward 1.0 (checklist, not a date)

- [ ] No further breaks on Chart props, composition slots, and documented hooks without a major
- [ ] Remount matrix in README stays the contract
- [ ] React 18 + 19 CI stays green
- [ ] Unstable stays in `@ruplot/react/unstable` (workers / transferable / DataPlane factory / sync rebind)
- [ ] Size budget (`pnpm size`) and stream-60 bench remain release gates

---

## Limitations / non-goals

- **Not** a general chart kit (no maps, pie, SVG scene graph). It is uPlot — canvas time-series / aligned data.
- **Not** “setState at 60Hz and we make it free.” The win is keeping the stream **off** the React commit path.
- **Not** React 17. No `useSyncExternalStore`, no deal.
- **Not** a drop-in if you recreate `options` every render or mutate `data` columns in place.
- Canvas is **client-only**. SSR is stores + HUD, then hydrate `<Chart>`.
- uPlot’s own limits still apply (aligned columns, scale model, plugin rules). Plugins must not fight the host `setData`.

---

## Mental model (below the fold)

```
React props ──► classify ──► commands ──► ChartSession ──► uPlot
                 │                              │
                 │                              ├── stores (cursor / scales / …)
                 │                              └── no Context re-renders for 60Hz paths
                 └── identity → value → targeted patch / recreate
```

Classifier internals, store batching, and debug snapshots: [Storybook API](https://avoronov93.github.io/react-uplot-core/?path=/docs/01-overview-api--docs).

---

## Large data

![static pan/zoom](./docs/media/large-static.gif)
![dynamic zoom](./docs/media/large-dynamic.gif)

---

## Packages

| Package | Use when |
| --- | --- |
| [`@ruplot/react`](https://www.npmjs.com/package/@ruplot/react) | React apps — this is the product |
| [`@ruplot/core`](https://www.npmjs.com/package/@ruplot/core) | Non-React hosts / custom bindings on the same session + classifier |

## License

MIT
