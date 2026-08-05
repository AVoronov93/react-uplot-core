# @ruplot/benchmarks

Reproducible competitor matrix for ruplot.

## Competitors

1. raw uPlot (`baseline`)
2. `uplot-react`
3. `react-uplot`
4. `@ruplot/react` (`ruplot`)

## Metrics

| Scenario | What it measures |
| --- | --- |
| mount | create cost (p50 / p95) |
| update | `setData` / prop data swap |
| stream-60 | FPS + React commit count over 2s |
| resize | `setSize` / options size change |
| zoom | `setScale` / scale props |
| cursor | programmatic cursor moves |

Also records heap delta when Chromium `performance.memory` is available.

## Run

```bash
# from repo root
pnpm --filter @ruplot/core build
pnpm --filter @ruplot/react build
pnpm bench
```

Outputs:

- `results/latest.json` — machine-readable
- `results/latest.md` — README-friendly table

## Fairness notes (v1 harness)

- Mount/update/resize/zoom timings include two `requestAnimationFrame` settles so React layout effects are counted.
- Cursor is measured synchronously (imperative `setCursor`).
- **ruplot** uses declarative mount + **imperative hot path** (`setData` / `setSize` / `setScale`) after mount — this is the intended high-frequency API. Competitors re-render on each tick, which is why their React commit counts explode during streaming.

This is documented so the matrix is not “cheating”: it measures the architecture we recommend for 60Hz+ feeds.
