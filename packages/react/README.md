# @ruplot/react

**uPlot in React that does not torch your commit budget.**  
60Hz streaming, **0 React commits** on the stream-60 scenario, same FPS as raw uPlot.

**React 18+** (19 recommended). Product name **ruplot** — this package is the React API. Engine: [`@ruplot/core`](https://www.npmjs.com/package/@ruplot/core). Repo `react-uplot-core` → packages `@ruplot/*`.

[![npm](https://img.shields.io/npm/v/@ruplot/react?label=%40ruplot%2Freact)](https://www.npmjs.com/package/@ruplot/react)
[![CI](https://img.shields.io/github/actions/workflow/status/AVoronov93/react-uplot-core/ci.yml?label=CI)](https://github.com/AVoronov93/react-uplot-core/actions)
[![React 18/19](https://img.shields.io/badge/React-18%20%2F%2019-61dafb)](https://github.com/AVoronov93/react-uplot-core)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785)](https://avoronov93.github.io/react-uplot-core/)
[![license](https://img.shields.io/badge/license-MIT-green)](https://github.com/AVoronov93/react-uplot-core/blob/main/LICENSE)

```bash
pnpm add @ruplot/react uplot
```

```tsx
import { Chart } from "@ruplot/react";
import "uplot/dist/uPlot.min.css";

<Chart data={data} options={options} />
```

**Use it** for realtime dashboards, telemetry, trading / industrial charts — anywhere cursor, scales, or data update often and React commit cost matters.

**Skip it** for static one-shots, React &lt; 18, or apps that recreate `options={{ … }}` every render.

| | raw uPlot | uplot-react | react-uplot | **ruplot** |
| --- | ---: | ---: | ---: | ---: |
| stream-60 **FPS** | 59.1 | 59.0 | 59.1 | **59.1** |
| stream React **commits** | 0 | 119 | 119 | **0** |

CI **stream-60** lane (`pnpm bench`). [See React commits: uplot-react vs ruplot](https://avoronov93.github.io/react-uplot-core/?path=/docs/07-compare-streaming-commits--docs).

**Hot path:** stable `options` / `data` refs · immutable columns · no 60Hz `useState` buffer.

**Docs:** [GitHub README](https://github.com/AVoronov93/react-uplot-core#readme) (recipes, remount, migration, stability) · [Storybook](https://avoronov93.github.io/react-uplot-core/) · [API](https://avoronov93.github.io/react-uplot-core/?path=/docs/01-overview-api--docs)

---

## Chart

```tsx
import { Chart, useCursor, useScales } from "@ruplot/react";

function Hud() {
  const idx = useCursor((c) => c.idx);
  const x = useScales((s) => s.x);
  return <span>{idx ?? "—"}</span>;
}

<Chart data={data} options={options} streaming>
  <Hud />
</Chart>
```

| Prop | Notes |
| --- | --- |
| `data` / `options` | Required. Prefer typed arrays + memoized options. |
| `streaming` | `true` ≡ `{ enabled: true, resetScales: false, follow: true }` |
| `resetScales` | Prefer `streaming` for the full policy. |
| `plugins` | Stable array (`usePlugin` / module). |
| `stores` | Pre-created `createChartStores()` for SSR / shared HUD. |
| `debug` | `true` or `{ log, onClassify }` — command counters + recreate reasons. |
| `sync` | Inherit `<Chart.SyncGroup>` or pass `false` to opt out. |
| `onReady` | After mount / recreate. |

Ref: `getInstance()`, `session`, `getDebugSnapshot()`.

### Composition

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

Also: `Chart.AutoSize`, `Chart.Plot` (alias of `Chart`), `useBrushStreamPolicy` (follow XOR brush owns X).

Hooks must run **under** `<Chart>`. They use `useSyncExternalStore` — the canvas tree does not re-render on cursor/scale.

| Hook | Store |
| --- | --- |
| `useCursor` | nearest index / pixel position |
| `useScales` | scale min/max |
| `useSeries` | visibility / focus |
| `useSelection` | select rect |
| `useSync` | sync peers |
| `useUPlot` / `useChartHandle` | imperative instance + session |

---

## Streaming

Do **not** put the buffer in `useState` at 60Hz. Keep it in a ref and call `setData` on the instance (see Storybook **03 Updates → Streaming**), or use the helper for slower React-driven windows:

```tsx
import { Chart, streamingWindow } from "@ruplot/react";

setData((prev) =>
  streamingWindow({ buffer: prev, chunk: [[t], [y]], capacity: 120 }),
);

<Chart data={data} options={options} streaming={{ enabled: true, follow: true }} />
```

Other stable helpers: `seriesStepped`, `holdForwardGaps`, `dualData`, `thresholdPlugin`, `objectSeriesPaths`, `createPlugin`, `createChartStores`, `batchStores`.

---

## SSR / hydrate

uPlot needs a DOM node — **do not mount `<Chart>` on the server**. Pre-create stores, render HUD from `getServerSnapshot`, pass the **same** instance on the client:

```tsx
import { Chart, createChartStores } from "@ruplot/react";
import { useSyncExternalStore } from "react";

const stores = createChartStores();

function CursorHud() {
  const idx = useSyncExternalStore(
    stores.cursor.subscribe,
    () => stores.cursor.getSnapshot().idx,
    () => stores.cursor.getServerSnapshot().idx,
  );
  return <span>{idx ?? "—"}</span>;
}

// Server: <CursorHud />
// Client: <CursorHud /><Chart data={data} options={options} stores={stores} />
```

---

## Debug

```tsx
<Chart ref={ref} data={data} options={options} debug />
ref.current?.getDebugSnapshot();
// { stats: { setData, patchSeries, recreate, … }, lastKind, lastReasons }
```

---

## What updates without remounting

| Change | Path |
| --- | --- |
| `data` (new series refs) | `setData` |
| `stroke` / `width` / `dash` / `fill` / `spanGaps` | `patchSeries` |
| size | `setSize` |
| axis `values` / `label` (formatters) | slotted — no remount |
| `series.paths`, axis `side`, plugin list, `title`, … | **recreate** + restore zoom/cursor |

---

## Stability

| Import | Status |
| --- | --- |
| `@ruplot/react` | **stable for 0.x** — Chart, composition, hooks, common helpers |
| `@ruplot/react/unstable` | **unstable until 1.0** — `streamingWindowTransferable`, `createDataWorker`, `createDataPlane`, `rebindSyncGroup` |
| [`@ruplot/core`](https://www.npmjs.com/package/@ruplot/core) | engine — session, classifier, stores |

**Non-goals:** not a general chart kit; not React 17; not free if you `setState` the buffer at 60Hz.

Peers: `react` / `react-dom` `^18 || ^19`, `uplot` `^1.6.31`.

## License

MIT
