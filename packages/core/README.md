# @ruplot/core

Framework-agnostic engine: `ChartSession`, option classifier, stores, sync, DataPlane, plugins.

React apps should use [`@ruplot/react`](../react). Documentation: [root README](../../README.md).

```bash
pnpm add @ruplot/core uplot
```

```ts
import { createChartSession, classifyOptions } from "@ruplot/core";

const session = createChartSession({ target, options, data });
session.apply([{ type: "setData", data: next, resetScales: false }]);
```
