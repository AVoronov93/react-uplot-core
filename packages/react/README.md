# @ruplot/react

React 19 bindings for [uPlot](https://github.com/leeoniya/uPlot) that keep streaming charts off the React commit path.

At 60Hz, typical wrappers re-render ~100+ times. **ruplot stays at 0 React commits** while matching raw uPlot FPS — [benchmarks in the monorepo README](https://github.com/Avoronov93/react-uplot-core#why-not-just-wrap-uplot).

```bash
pnpm add @ruplot/react uplot
```

```tsx
import { Chart } from "@ruplot/react";
import "uplot/dist/uPlot.min.css";

<Chart data={data} options={options} />
```

**Demos:** [Storybook](https://avoronov93.github.io/react-uplot-core/)  
**Docs:** [GitHub README](https://github.com/Avoronov93/react-uplot-core#readme)

Composition: `Chart.Brush`, `Chart.Tooltip`, `Chart.Legend`, `Chart.AutoSize`, `Chart.SyncGroup`, `useBrushStreamPolicy`.
