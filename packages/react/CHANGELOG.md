# @ruplot/react

## 0.3.1

### Patch Changes

- 8c316f1: Docs/positioning patch: README hero rewrite (who/not, stream-60 proof, stability/limitations, 1.0 checklist), npm description + keywords, action-oriented Compare proof links, messaging consistency (React 18+, ruplot / `@ruplot/*`, unstable labeled as unstable).
- Updated dependencies [8c316f1]
  - @ruplot/core@0.3.1

## 0.3.0

### Minor Changes

- 3289916: API stability split for 0.3 (`@ruplot/react/unstable`). Store `batchStores` + uPlot-turn microtask coalescing (no React `unstable_batchedUpdates`). Explicit SSR hydrate test/docs for pre-created `stores`.

  P0 readiness: React 18+ peers, CI React 18/19 matrix, Chart `debug` / `getDebugSnapshot` + recreate reasons, in-place data mutation warning (dev), Brush ResizeObserver + page-step keyboard, docs consolidated into README (when-to-use, remount rules, migration from uplot-react / react-uplot / raw uPlot), npm keywords + README badges.

### Patch Changes

- Updated dependencies [3289916]
  - @ruplot/core@0.3.0

## 0.2.0

### Minor Changes

- eb88bf3: Initial public release

### Patch Changes

- Updated dependencies [eb88bf3]
  - @ruplot/core@0.2.0

## 0.1.0

### Initial public release

- `<Chart>` with composition: Brush, Tooltip, Legend, AutoSize, SyncGroup
- `useBrushStreamPolicy`, `usePlugin`, external-store hooks
- React 19 + SSR-safe stores bridge
