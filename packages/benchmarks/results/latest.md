# Benchmark results

Generated: 2026-08-04T20:10:29.740Z

**Environment:** `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36`  
**Config:** 2000 points · warmup 3 · measured 12 · stream 2000ms

| Metric | baseline | uplot-react | react-uplot | ruplot |
| --- | --- | --- | --- | --- |
| mount p50 | 32.70ms | 32.90ms | 32.50ms | 33.00ms |
| mount p95 | 34.50ms | 34.00ms | 34.70ms | 34.10ms |
| update p50 | 33.00ms | 32.80ms | 32.40ms | 33.00ms |
| stream-60 FPS | 59.1 | 59.0 | 59.1 | 59.1 |
| stream React commits | 0 | 119 | 119 | 0 |
| resize p50 | 33.00ms | 32.80ms | 33.00ms | 33.10ms |
| zoom p50 | 33.10ms | 33.50ms | 33.10ms | 33.40ms |
| cursor p50 | 0.00ms | 0.00ms | 0.00ms | 0.00ms |

> Hard gate: compared to [`baseline.json`](./baseline.json) — ruplot stream commits ≤5, FPS ≥50, p95 ≤ reference × 1.10. Override with `BENCH_SOFT_GATE=1`.
