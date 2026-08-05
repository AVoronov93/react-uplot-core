# @ruplot/core

Framework-agnostic engine behind ruplot: `ChartSession`, option classifier, stores, sync, plugins.

React apps should use [`@ruplot/react`](https://www.npmjs.com/package/@ruplot/react).

```bash
pnpm add @ruplot/core uplot
```

```ts
import { createChartSession } from "@ruplot/core";

const session = createChartSession({ target, options, data });
session.apply([{ type: "setData", data: next, resetScales: false }]);
```

**Docs & benchmarks:** [GitHub README](https://github.com/Avoronov93/react-uplot-core#readme)
