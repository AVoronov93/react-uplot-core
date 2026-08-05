# @ruplot/react

Benchmark-driven React 19 bindings for [uPlot](https://github.com/leeoniya/uPlot).

Full documentation: [root README](../../README.md) · live demos: [Storybook](https://avoronov93.github.io/react-uplot-core/)

```bash
pnpm add @ruplot/react uplot
```

```tsx
import { Chart } from "@ruplot/react";
import "uplot/dist/uPlot.min.css";

<Chart data={data} options={options} />
```

Composition: `Chart.Brush`, `Chart.Tooltip`, `Chart.Legend`, `Chart.AutoSize`, `Chart.SyncGroup`, `useBrushStreamPolicy`.
