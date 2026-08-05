# @ruplot/experiments (private)

Post-v1 probes — **not** a published API.

## Data Worker

`streamingWindowTransferable` + `createDataWorker` move sliding-window concat off the main thread with transferable `Float64Array` buffers.

```ts
import { createDataWorker } from "@ruplot/experiments";

const worker = new Worker(new URL("./aligned-data.worker.ts", import.meta.url), {
  type: "module",
});
const client = createDataWorker(worker);
const next = await client.window({ buffer, chunk, capacity: 400 });
```

## OffscreenCanvas

`probeOffscreenCanvas()` documents environment support. **uPlot is DOM-coupled** — full Worker charting is out of scope; use data Workers instead.

```bash
pnpm --filter @ruplot/experiments test
```

See root [README](../../README.md).
