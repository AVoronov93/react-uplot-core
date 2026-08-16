# @ruplot/core

**Framework-agnostic uPlot engine** behind [`@ruplot/react`](https://www.npmjs.com/package/@ruplot/react): `ChartSession`, option classifier, external stores, sync, plugins.

React apps should start with `@ruplot/react`. Use this package for custom hosts, workers, or non-React bindings.

Product **ruplot** · repo `react-uplot-core` → packages [`@ruplot/react`](https://www.npmjs.com/package/@ruplot/react) + [`@ruplot/core`](https://www.npmjs.com/package/@ruplot/core).

```bash
pnpm add @ruplot/core uplot
```

```bash
pnpm add @ruplot/core uplot
```

```ts
import { createChartSession, classifyOptions } from "@ruplot/core";

const session = createChartSession({ target, options, data });
session.apply([{ type: "setData", data: next, resetScales: false }]);
```

**Docs:** [GitHub README](https://github.com/AVoronov93/react-uplot-core#readme) · [Storybook API](https://avoronov93.github.io/react-uplot-core/?path=/docs/01-overview-api--docs)

---

## Session

`createChartSession` owns one uPlot instance: apply command batches, restore zoom/cursor across recreate, expose stores.

```ts
const session = createChartSession({
  target,
  options,
  data,
  stores, // optional pre-created ChartStores (SSR / HUD)
});

session.apply(classifyOptions({ prevOptions, nextOptions, prevData, nextData }).commands);
const u = session.getInstance();
session.destroy();
```

uPlot hooks that touch several stores (`setCursor` + `setScale` in one turn) are wrapped in a store batch and flushed on a **microtask** — no React `unstable_batchedUpdates`.

---

## Classifier

You usually do not call this from app code — `@ruplot/react` `<Chart>` does. It maps option/data diffs to cheap commands instead of `new uPlot` on every render.

| Change | Command |
| --- | --- |
| `data` identity / contents | `setData` |
| `width` / `height` only | `setSize` |
| `scales.*.min/max` only | `setScale` |
| series visual (`stroke`, `width`, `dash`, `fill`, `spanGaps`) | `patchSeries` |
| axis formatters (`values`, `label`, …) | slotted — no recreate |
| `title` / `paths` / plugins / axis `side` / … | `recreate` (+ runtime restore) |

`ClassifyResult.reasons` lists recreate triggers (debug tooling).

Treat `data` columns as **immutable**. `warnIfDataMutatedInPlace` logs in development when the same array is mutated.

---

## Stores

`createChartStores()` builds cursor / scales / selection / series / sync / meta stores compatible with `useSyncExternalStore` (`subscribe`, `getSnapshot`, `getServerSnapshot`).

```ts
import { createChartStores, batchStores } from "@ruplot/core";

const stores = createChartStores();

batchStores(() => {
  stores.cursor.setState(nextCursor);
  stores.scales.setState(nextScales);
});
```

`getServerSnapshot()` is fixed at create time (SSR hydrate contract). `store.batch(fn)` coalesces notifies on one store; `batchStores` covers several.

---

## Data helpers

| Helper | Role |
| --- | --- |
| `streamingWindow` | Fixed-capacity append / drop-oldest |
| `streamingWindowTransferable` | Same, transferable typed buffers (`@ruplot/react/unstable`) |
| `dualData` / `createDataPlane` | Display Y vs source values for tooltips |
| `seriesStepped` / `holdForwardGaps` | Stepped series + sparse feeds |
| `createDataWorker` | Off-thread window client |

---

## Plugins & sync

```ts
import { createPlugin, thresholdPlugin, objectSeriesPaths, joinSyncGroup } from "@ruplot/core";

const plugins = [thresholdPlugin({ y: 25, stroke: "#f97316" })];
```

`createPlugin({ key, init })` diffs by key across recreate so DOM overlays do not leak. Plugins must **not** call `setData` — the host owns the data plane.

Sync: `joinSyncGroup` / `rebindSyncGroup` / `subscribeSyncGroup`. React wraps this as `<Chart.SyncGroup>`.

---

## Debug

```ts
session.setDebug(true, { log: true });
session.getDebugSnapshot();
// { stats, lastKind, lastReasons, lastApplied }
session.resetDebugStats();
```

Peer: `uplot` `^1.6.31`.

React apps: [`@ruplot/react`](https://www.npmjs.com/package/@ruplot/react). Unstable helpers (`createDataWorker`, `createDataPlane`, `streamingWindowTransferable`, `rebindSyncGroup`) are also on `@ruplot/react/unstable`.

## License

MIT
