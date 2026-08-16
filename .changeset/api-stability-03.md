---
"@ruplot/core": minor
"@ruplot/react": minor
---

API stability split for 0.3 (`@ruplot/react/unstable`). Store `batchStores` + uPlot-turn microtask coalescing (no React `unstable_batchedUpdates`). Explicit SSR hydrate test/docs for pre-created `stores`.

P0 readiness: React 18+ peers, CI React 18/19 matrix, Chart `debug` / `getDebugSnapshot` + recreate reasons, in-place data mutation warning (dev), Brush ResizeObserver + page-step keyboard, docs consolidated into README (when-to-use, remount rules, migration from uplot-react / react-uplot / raw uPlot), npm keywords + README badges.
