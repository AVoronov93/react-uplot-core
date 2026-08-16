# @ruplot/react

React **18+** bindings for [uPlot](https://github.com/leeoniya/uPlot) that keep streaming charts off the React commit path (19 recommended).

At 60Hz, typical wrappers re-render ~100+ times. **ruplot stays at 0 React commits** while matching raw uPlot FPS.

```bash
pnpm add @ruplot/react uplot
```

```tsx
import { Chart } from "@ruplot/react";
import "uplot/dist/uPlot.min.css";

<Chart data={data} options={options} />
```

Keep `options` and `data` **stable by reference** on hot paths (`useMemo` / module scope). Inline `options={{ … }}` every render forces extra classifier work and can recreate the chart.

**Docs:** [repo README](https://github.com/Avoronov93/react-uplot-core#readme) (when-to-use, remount rules, migration)  
**Demos:** [Storybook](https://avoronov93.github.io/react-uplot-core/) · [API tables](https://avoronov93.github.io/react-uplot-core/?path=/docs/01-overview-api--docs)

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

Do **not** put the buffer in `useState` at 60Hz. Keep it in a ref and call `session` / `setData` (see Storybook **03 Updates → Streaming**), or use the helper for slower React-driven windows:

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

`debug={true}` logs recreate reasons. `RUPLOT_DEBUG=1` also enables logging. In-place mutation of `data` columns warns in development.

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
| `@ruplot/react` | **stable** — Chart, composition, hooks, common helpers |
| `@ruplot/react/unstable` | **unstable** until 1.0 — `streamingWindowTransferable`, `createDataWorker`, `createDataPlane`, `rebindSyncGroup` |
| [`@ruplot/core`](https://www.npmjs.com/package/@ruplot/core) | engine — session, classifier, stores |

```ts
import { Chart, streamingWindow } from "@ruplot/react";
import { streamingWindowTransferable } from "@ruplot/react/unstable";
```

Peers: `react` / `react-dom` `^18 || ^19`, `uplot` `^1.6.31`.

## License

MIT
