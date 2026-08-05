/**
 * Copy-pasteable app usage for Storybook docs (`parameters.docs.source`).
 * Keep these self-contained — readers should not need the XxxDemo wrappers.
 */

export const USAGE = {
	basic: `import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

const data: uPlot.AlignedData = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [10, 14, 12, 18, 16, 20, 17, 22, 19, 24],
];

export function BasicChart() {
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      series: [{}, { label: "Signal", stroke: "#0ea5e9", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [],
  );

  return <Chart data={data} options={options} />;
}`,

	hooks: `import { Chart, useCursor, useScales } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

function Hud() {
  // Must run under <Chart>. Subscribes via useSyncExternalStore —
  // only this subtree re-renders on cursor/scale, not the canvas tree.
  const idx = useCursor((c) => c.idx);
  const x = useScales((s) => s.x);
  return (
    <div>
      idx={idx ?? "—"} · x {x?.min?.toFixed(1)}–{x?.max?.toFixed(1)}
    </div>
  );
}

export function HooksChart({ data }: { data: uPlot.AlignedData }) {
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [],
  );

  return (
    <Chart data={data} options={options}>
      <Hud />
    </Chart>
  );
}`,

	streaming: `import { Chart, type ChartRef } from "@ruplot/react";
import { useLayoutEffect, useRef } from "react";
import type uPlot from "uplot";

const POINTS = 400;

function makeBuffer(): uPlot.AlignedData {
  const x = new Float64Array(POINTS);
  const y = new Float64Array(POINTS);
  for (let i = 0; i < POINTS; i++) {
    x[i] = i;
    y[i] = Math.sin(i / 18) * 12;
  }
  return [x, y];
}

function advance(data: uPlot.AlignedData, tick: number) {
  const x = data[0] as Float64Array;
  const y = data[1] as Float64Array;
  x.copyWithin(0, 1);
  y.copyWithin(0, 1);
  x[POINTS - 1] = x[POINTS - 2]! + 1;
  y[POINTS - 1] = Math.sin((tick + POINTS) / 18) * 12;
}

const options: uPlot.Options = {
  width: 720,
  height: 260,
  series: [{}, { stroke: "#0ea5e9", width: 2 }],
  scales: { x: { time: false } },
  legend: { show: false },
  cursor: { show: false },
};

/** 60Hz path: mutate a buffer + imperative setData — do NOT put the buffer in useState. */
export function StreamingChart() {
  const chartRef = useRef<ChartRef>(null);
  const dataRef = useRef(makeBuffer());
  const tickRef = useRef(0);

  useLayoutEffect(() => {
    let raf = 0;
    const loop = () => {
      tickRef.current += 1;
      advance(dataRef.current, tickRef.current);
      const u = chartRef.current?.getInstance();
      if (u) {
        const x = dataRef.current[0] as Float64Array;
        u.setData(dataRef.current, false);
        u.setScale("x", { min: x[0]!, max: x[x.length - 1]! });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <Chart ref={chartRef} data={dataRef.current} options={options} />;
}`,

	large: `import { Chart, type ChartRef } from "@ruplot/react";
import { useMemo, useRef } from "react";
import type uPlot from "uplot";

// Prefer Float64Array for multi-million points; keep the same array identity.
function build(n: number): uPlot.AlignedData {
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = i;
    y[i] = Math.sin(i / 120_000) * 40;
  }
  return [x, y];
}

export function LargeChart({ n = 1_000_000 }: { n?: number }) {
  const chartRef = useRef<ChartRef>(null);
  const data = useMemo(() => build(n), [n]);

  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 300,
      series: [{}, { stroke: "#0ea5e9", width: 1, points: { show: false } }],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [],
  );

  const zoomWindow = (min: number, max: number) => {
    chartRef.current?.getInstance()?.setScale("x", { min, max });
  };

  return (
    <>
      <button type="button" onClick={() => zoomWindow(0, n)}>Full</button>
      <button type="button" onClick={() => zoomWindow(n * 0.4, n * 0.6)}>
        Zoom mid 20%
      </button>
      <Chart ref={chartRef} data={data} options={options} />
    </>
  );
}`,

	"large-resize": `import { Chart } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";

/** Only width/height change → classifier calls setSize; pan/zoom survive. */
export function ResizableLarge({ data }: { data: uPlot.AlignedData }) {
  const [width, setWidth] = useState(720);
  const [height, setHeight] = useState(300);

  const options = useMemo<uPlot.Options>(
    () => ({
      width,
      height,
      series: [{}, { stroke: "#0ea5e9", width: 1, points: { show: false } }],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [width, height],
  );

  return (
    <>
      <input
        type="range"
        min={400}
        max={1000}
        value={width}
        onChange={(e) => setWidth(Number(e.target.value))}
      />
      <Chart data={data} options={options} />
    </>
  );
}`,

	"large-resize-stream": `import { Chart, type ChartRef } from "@ruplot/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";

const CAPACITY = 200_000;

function makeBuffer(): uPlot.AlignedData {
  const x = new Float64Array(CAPACITY);
  const y = new Float64Array(CAPACITY);
  for (let i = 0; i < CAPACITY; i++) {
    x[i] = i;
    y[i] = Math.sin(i / 200) * 10;
  }
  return [x, y];
}

export function LargeStreamResize() {
  const chartRef = useRef<ChartRef>(null);
  const dataRef = useRef(makeBuffer());
  const tick = useRef(0);
  const [width, setWidth] = useState(720);
  const [height, setHeight] = useState(300);

  const options = useMemo<uPlot.Options>(
    () => ({
      width,
      height,
      series: [{}, { stroke: "#0ea5e9", width: 1, points: { show: false } }],
      scales: { x: { time: false } },
      legend: { show: false },
      cursor: { show: false },
    }),
    [width, height],
  );

  useLayoutEffect(() => {
    let raf = 0;
    const loop = () => {
      tick.current += 1;
      const data = dataRef.current;
      const x = data[0] as Float64Array;
      const y = data[1] as Float64Array;
      x.copyWithin(0, 1);
      y.copyWithin(0, 1);
      x[CAPACITY - 1] = x[CAPACITY - 2]! + 1;
      y[CAPACITY - 1] = Math.sin((tick.current + CAPACITY) / 200) * 10;

      const u = chartRef.current?.getInstance();
      if (u) {
        u.setData(data, false);
        u.setScale("x", { min: x[0]!, max: x[CAPACITY - 1]! });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <button type="button" onClick={() => setWidth((w) => w + 40)}>Wider</button>
      <Chart ref={chartRef} data={dataRef.current} options={options} />
    </>
  );
}`,

	"resize-preserve": `import { Chart, type ChartRef, type TimeRange } from "@ruplot/react";
import { useMemo, useRef, useState } from "react";
import type uPlot from "uplot";

const data: uPlot.AlignedData = [
  Array.from({ length: 100 }, (_, i) => i),
  Array.from({ length: 100 }, (_, i) => Math.sin(i / 8) * 10 + 20),
];
const FULL: TimeRange = { min: 0, max: 99 };

/**
 * Changing only width/height → setSize (zoom kept).
 * Keep series:[] stable; put width/height in the memo deps.
 */
export function ResizePreserveZoom() {
  const chartRef = useRef<ChartRef>(null);
  const [width, setWidth] = useState(720);
  const [range, setRange] = useState<TimeRange>({ min: 20, max: 60 });

  const options = useMemo<uPlot.Options>(
    () => ({
      width,
      height: 260,
      series: [{}, { label: "Signal", stroke: "#0ea5e9", width: 2 }],
      scales: { x: { time: false, min: range.min, max: range.max } },
      legend: { show: false },
      cursor: { drag: { x: true, y: false } },
    }),
    [width, range],
  );

  return (
    <>
      <button type="button" onClick={() => setWidth(480)}>Narrow</button>
      <button type="button" onClick={() => setWidth(720)}>Normal</button>
      <button type="button" onClick={() => setWidth(900)}>Wide</button>
      <button
        type="button"
        onClick={() => {
          setRange({ min: 20, max: 60 });
          chartRef.current?.getInstance()?.setScale("x", { min: 20, max: 60 });
        }}
      >
        Zoom 20–60
      </button>
      <button
        type="button"
        onClick={() => {
          setRange(FULL);
          chartRef.current?.getInstance()?.setScale("x", FULL);
        }}
      >
        Full X
      </button>

      <Chart ref={chartRef} data={data} options={options}>
        <Chart.Brush value={range} onChange={setRange} />
      </Chart>
    </>
  );
}`,

	classifier: `import { Chart } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";

const dataA: uPlot.AlignedData = [/* … */, /* amp 8 */];
const dataB: uPlot.AlignedData = [/* … */, /* amp 18 */];

/**
 * You do not call classifyOptions in app code — <Chart> does.
 * Rules of thumb:
 *   data identity/contents           → setData
 *   width/height only                → setSize
 *   series stroke/width/dash/fill    → patchSeries + redraw
 *   hooks identity                   → ignored (slotted refs)
 *   axis values/splits/space/filter  → slotted via setUserAxes
 *   title / paths / plugins / axis side → recreate (+ runtime restore)
 */
export function ClassifierAware() {
  const [flip, setFlip] = useState(false);
  const [wide, setWide] = useState(false);

  const options = useMemo<uPlot.Options>(
    () => ({
      width: wide ? 520 : 720,
      height: 260,
      series: [{}, { stroke: flip ? "#f97316" : "#0ea5e9", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [flip, wide],
  );

  return (
    <>
      <button type="button" onClick={() => setFlip((v) => !v)}>
        Toggle stroke (patchSeries)
      </button>
      <button type="button" onClick={() => setWide((v) => !v)}>
        Toggle width (setSize)
      </button>
      <Chart data={flip ? dataB : dataA} options={options} />
    </>
  );
}`,

	brush: `import { Chart, type TimeRange } from "@ruplot/react";
import { useId, useMemo, useState } from "react";
import type uPlot from "uplot";

/** Build once: path in data-x / fixed-Y space. Pan the window via SVG viewBox. */
function buildMinimapPath(xs: number[], ys: number[]) {
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const y of ys) {
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  const span = Math.max(yMax - yMin, 1e-6);
  const pad = 4;
  const h = 40 - pad * 2;
  let d = "";
  for (let i = 0; i < xs.length; i++) {
    const y = pad + (1 - (ys[i]! - yMin) / span) * h;
    d += \`\${i === 0 ? "M" : "L"}\${xs[i]} \${y.toFixed(2)} \`;
  }
  d += \`L\${xs[xs.length - 1]} \${pad + h} L\${xs[0]} \${pad + h} Z\`;
  return d;
}

/** App-owned sparkline for Brush children — not part of @ruplot/react. */
function Sparkline({
  path,
  range,
}: {
  path: string;
  range: TimeRange;
}) {
  const gradId = useId().replace(/:/g, "");
  const span = Math.max(range.max - range.min, 1e-6);
  return (
    <svg
      viewBox={\`\${range.min} 0 \${span} 40\`}
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill={\`url(#\${gradId})\`}
        stroke="#7dd3fc"
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/*
  CSS (semicircle caps only — keep the band rectangular):

  .frame-grip.ruplot-brush-grip--min { border-radius: 999px 0 0 999px; }
  .frame-grip.ruplot-brush-grip--max { border-radius: 0 999px 999px 0; }
  .frame-band { border-radius: 0; overflow: hidden; }
*/

export function DetailPlusOverview({ history }: { history: uPlot.AlignedData }) {
  const [range, setRange] = useState<TimeRange>({ min: 80, max: 200 });
  const xs = history[0] as number[];
  const ys = history[1] as number[];
  const minimapPath = useMemo(() => buildMinimapPath(xs, ys), [xs, ys]);

  const detailOpts = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 220,
      series: [{}, { stroke: "#e2e8f0", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
      cursor: { drag: { x: true, y: false } },
    }),
    [],
  );

  const overviewOpts = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 64,
      series: [{}, { stroke: "rgba(148,163,184,0.35)", width: 1 }],
      scales: { x: { time: false } },
      legend: { show: false },
      axes: [{ show: false }, { show: false }],
      cursor: { drag: { setScale: false, x: false, y: false } },
    }),
    [],
  );

  return (
    <>
      <Chart data={history} options={detailOpts}>
        <Chart.Brush value={range} onChange={setRange} />
      </Chart>

      <Chart data={history} options={overviewOpts}>
        <Chart.Brush
          value={range}
          onChange={setRange}
          bindScale={false}
          grips
          showSelect={false}
          gripWidth={18}
          bandClassName="frame-band"
          gripClassName="frame-grip"
          bandStyle={{
            background: "rgba(15, 23, 42, 0.72)",
            borderLeft: "none",
            borderRight: "none",
            borderRadius: 0,
          }}
          gripStyle={{
            background: "linear-gradient(180deg, #f8fafc, #94a3b8)",
          }}
        >
          <Sparkline path={minimapPath} range={range} />
        </Chart.Brush>
      </Chart>
    </>
  );
}`,

	sync: `import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

export function SyncedPair({ data }: { data: uPlot.AlignedData }) {
  const top = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 160,
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
      cursor: { drag: { x: true, y: false } },
    }),
    [],
  );
  const bottom = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 160,
      series: [{}, { stroke: "#f97316", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
      cursor: { drag: { x: true, y: false } },
    }),
    [],
  );

  return (
    <Chart.SyncGroup id="plant">
      <Chart data={data} options={top} />
      <Chart data={data} options={bottom} />
    </Chart.SyncGroup>
  );
}`,

	tooltip: `import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

const SERIES = [
  { label: "Inlet", stroke: "#38bdf8", unit: "°C" },
  { label: "Outlet", stroke: "#f97316", unit: "°C" },
] as const;

export function TooltipChart({ data }: { data: uPlot.AlignedData }) {
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      series: [{}, ...SERIES.map((s) => ({ label: s.label, stroke: s.stroke, width: 2 }))],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [],
  );

  return (
    <Chart data={data} options={options}>
      <Chart.Tooltip className="tt-shell" offset={{ x: 14, y: 10 }} clamp>
        {/* clamp (default true) keeps the box inside the Chart wrapper;
            flips left/above near the far edges. Pass clamp={false} to opt out. */}
        {({ idx, visible }) => {
          if (!visible || idx == null) return null;
          return (
            <div className="tt-card">
              <header>t = {(data[0] as number[])[idx]}</header>
              {SERIES.map((s, i) => {
                const y = (data[i + 1] as number[])[idx]!;
                const prev = (data[i + 1] as number[])[Math.max(0, idx - 1)]!;
                return (
                  <div key={s.label}>
                    <span style={{ color: s.stroke }}>{s.label}</span>{" "}
                    {y.toFixed(2)} {s.unit}{" "}
                    <span>
                      {y - prev >= 0 ? "▲" : "▼"} {Math.abs(y - prev).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        }}
      </Chart.Tooltip>
    </Chart>
  );
}`,

	"dual-data": `import { Chart, dualData } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

type Point = { raw: number; unit: string; label: string };

const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const source: (readonly Point[] | null)[] = [
  null,
  x.map((t) => ({
    raw: 100 + Math.sin(t) * 40,
    unit: "psi",
    label: \`sensor-\${t}\`,
  })),
];
const max = Math.max(...source[1]!.map((p) => p.raw));

const plane = dualData({
  x,
  source,
  toY: (p) => p.raw / max, // plot 0–1
});

export function DualDataChart() {
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
      scales: { x: { time: false }, y: { min: 0, max: 1 } },
      legend: { show: false },
    }),
    [],
  );

  return (
    <Chart data={plane.display} dataPlane={plane} options={options}>
      <Chart.Tooltip>
        {({ idx, visible }) => {
          if (!visible || idx == null) return null;
          const raw = plane.getSource(1, idx);
          if (!raw) return null;
          return (
            <div>
              {raw.label}: {raw.raw.toFixed(1)} {raw.unit}
            </div>
          );
        }}
      </Chart.Tooltip>
    </Chart>
  );
}`,

	"gaps-stepped": `import { Chart, holdForwardGaps, seriesStepped } from "@ruplot/react";
import type uPlot from "uplot";

const sparse: uPlot.AlignedData = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [12, 14, null, null, 18, 19, null, 21, 17, 24],
];

const held: uPlot.AlignedData = [
  sparse[0]!,
  holdForwardGaps(sparse[1] as ArrayLike<number | null>),
];

const options: uPlot.Options = {
  width: 720,
  height: 260,
  series: [{}, seriesStepped({ label: "Metric", stroke: "#0ea5e9", width: 2 })],
  scales: { x: { time: false } },
  legend: { show: false },
};

export function GapsStepped() {
  return <Chart data={held} options={options} />;
}`,

	"streaming-window": `import { Chart, streamingWindow } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";

const CAPACITY = 80;

function seed(): uPlot.AlignedData {
  const x = Array.from({ length: CAPACITY }, (_, i) => i);
  const y = x.map((i) => Math.sin(i / 10) * 8 + 10);
  return [x, y];
}

/** Prop-driven fixed window (React setState). For 60Hz use imperative setData instead. */
export function LiveWindow() {
  const [data, setData] = useState(seed);
  const tick = useRef(CAPACITY);

  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [],
  );

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      const t = tick.current;
      setData((prev) =>
        streamingWindow({
          buffer: prev,
          chunk: [[t], [Math.sin(t / 10) * 8 + 10]],
          capacity: CAPACITY,
        }),
      );
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <Chart
      data={data}
      options={options}
      streaming={{ enabled: true, follow: true }}
    />
  );
}`,

	threshold: `import { Chart, thresholdPlugin } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

// Keep plugins stable (module scope or useMemo) — new identity → recreate.
const plugins = [thresholdPlugin({ y: 25, stroke: "#f97316", dash: [6, 4] })];

export function ThresholdChart({ data }: { data: uPlot.AlignedData }) {
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [],
  );

  return <Chart data={data} options={options} plugins={plugins} />;
}`,

	events: `import { Chart, objectSeriesPaths } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

type EventMark = { color: string; label: string };

const events: (EventMark | null)[] = [
  null,
  { color: "#22c55e", label: "ok" },
  null,
  { color: "#ef4444", label: "alarm" },
  null,
  { color: "#eab308", label: "warn" },
];

const x = [0, 1, 2, 3, 4, 5];
const yMetric = [12, 15, 14, 22, 18, 19];
const yEvents = events.map((e) => (e ? 1 : null));
const data: uPlot.AlignedData = [x, yMetric, yEvents as number[]];

const eventPaths = objectSeriesPaths<EventMark>({
  get: (i) => events[i],
  render: ({ ctx, x: cx, y: cy, value }) => {
    ctx.beginPath();
    ctx.fillStyle = value.color;
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  },
});

export function EventsChart() {
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: {
        x: { time: false },
        y: {},
        ev: { auto: false, min: 0, max: 2 },
      },
      axes: [{}, { scale: "y" }, { scale: "ev", show: false }],
      series: [
        {},
        { label: "Metric", stroke: "#0ea5e9", width: 2, scale: "y" },
        { label: "Events", scale: "ev", paths: eventPaths, points: { show: false } },
      ],
      legend: { show: false },
    }),
    [],
  );

  return <Chart data={data} options={options} />;
}`,

	"custom-plugin": `import { Chart, createPlugin } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

const badgePlugin = createPlugin({
  key: "corner-badge",
  init({ u }) {
    const el = document.createElement("div");
    el.textContent = "live";
    el.style.cssText =
      "position:absolute;top:8px;right:8px;z-index:3;padding:4px 8px;background:#0f172a;color:#e2e8f0;font:11px sans-serif;";
    u.root.style.position = "relative";
    u.root.appendChild(el);
    return () => el.remove(); // called on destroy / recreate
  },
});

export function PluginChart({ data }: { data: uPlot.AlignedData }) {
  const plugins = useMemo(() => [badgePlugin], []);
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
      scales: { x: { time: false } },
      legend: { show: false },
    }),
    [],
  );

  return <Chart data={data} options={options} plugins={plugins} />;
}`,
	"series-visual": `import { Chart } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";

const data: uPlot.AlignedData = [/* x */, /* y */];
const COLORS = ["#0ea5e9", "#f97316", "#a855f7"];

export function SeriesVisualChart() {
  const [i, setI] = useState(0);
  const stroke = COLORS[i]!;
  // Only stroke changes → classifier emits patchSeries + redraw (no recreate).
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { label: "Signal", stroke, width: 2 }],
    }),
    [stroke],
  );

  return (
    <>
      <button type="button" onClick={() => setI((n) => (n + 1) % COLORS.length)}>
        Change stroke
      </button>
      <Chart data={data} options={options} />
    </>
  );
}`,

	"brush-pan-y": `import { Chart, type TimeRange } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";

export function BrushPanYExample({ data }: { data: uPlot.AlignedData }) {
  const [xRange, setXRange] = useState<TimeRange>({ min: 80, max: 180 });
  const [yRange, setYRange] = useState<TimeRange>({ min: 14, max: 28 });

  const detail = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 180,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
    }),
    [],
  );

  const overview = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 100,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#64748b", width: 1 }],
      cursor: { drag: { setScale: false, x: false, y: false } },
    }),
    [],
  );

  return (
    <>
      {/* Detail binds X */}
      <Chart data={data} options={detail}>
        <Chart.Brush value={xRange} onChange={setXRange} />
      </Chart>

      {/* Overview: panBand moves the window; grips resize it */}
      <Chart data={data} options={overview}>
        <Chart.Brush
          value={xRange}
          onChange={setXRange}
          bindScale={false}
          grips
          panBand
          showSelect={false}
        />
      </Chart>

      {/* Y frame selector — same pattern on scaleKey="y" */}
      <Chart data={data} options={{ ...overview, height: 210 }}>
        <Chart.Brush
          value={yRange}
          onChange={setYRange}
          orientation="y"
          scaleKey="y"
          bindScale={false}
          grips
          panBand
          showSelect={false}
        />
      </Chart>
    </>
  );
}`,

	"cursor-rich": `import { Chart, useCursor } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

function CursorValues({ data }: { data: uPlot.AlignedData }) {
  // Lean snapshot: { idx, idxs, left, top } — no series values copied.
  const { idx, idxs } = useCursor();
  const sineIdx = idxs?.[1] ?? null;
  const sineY = sineIdx == null ? null : (data[1] as number[])[sineIdx];

  return (
    <div>
      shared idx={idx ?? "—"} · series[1] idx={sineIdx ?? "—"} · y=
      {sineY?.toFixed?.(2) ?? "gap"}
    </div>
  );
}

export function CursorRichChart({ data }: { data: uPlot.AlignedData }) {
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [
        {},
        { label: "Sine", stroke: "#0ea5e9", width: 2 },
        { label: "Cosine", stroke: "#f97316", width: 2 },
      ],
    }),
    [],
  );

  return (
    <Chart data={data} options={options}>
      <CursorValues data={data} />
    </Chart>
  );
}`,

	"stream-policy": `import { Chart, streamingWindow } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";

const CAPACITY = 100;

export function StreamPolicyChart() {
  const [data, setData] = useState<uPlot.AlignedData>(() => {
    const x = Array.from({ length: CAPACITY }, (_, i) => i);
    return [x, x.map((i) => Math.sin(i / 9) * 8)];
  });
  const [follow, setFollow] = useState(true);
  const tick = useRef(CAPACITY);

  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
    }),
    [],
  );

  useEffect(() => {
    const id = setInterval(() => {
      const t = ++tick.current;
      // Helper = buffer shape. Chart streaming = viewport policy.
      setData((prev) =>
        streamingWindow({
          buffer: prev,
          chunk: [[t], [Math.sin(t / 9) * 8]],
          capacity: CAPACITY,
        }),
      );
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <button type="button" onClick={() => setFollow((v) => !v)}>
        Follow: {follow ? "on" : "off"}
      </button>
      <Chart data={data} options={options} streaming={{ enabled: true, follow }} />
    </>
  );
}`,

	"auto-size": `import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

function SizedChart({
  data,
  width,
  height,
}: {
  data: uPlot.AlignedData;
  width: number;
  height: number;
}) {
  const options = useMemo<uPlot.Options>(
    () => ({
      width,
      height,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
    }),
    [width, height],
  );
  return <Chart data={data} options={options} />;
}

export function AutoSizeChart({ data }: { data: uPlot.AlignedData }) {
  return (
    <div style={{ resize: "both", overflow: "auto", width: 720, height: 280 }}>
      {/* Observes BOTH width and height of this container */}
      <Chart.AutoSize minWidth={320} minHeight={180} style={{ width: "100%", height: "100%" }}>
        {({ width, height }) => <SizedChart data={data} width={width} height={height} />}
      </Chart.AutoSize>
    </div>
  );
}`,

	legend: `import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";

export function LegendChart({ data }: { data: uPlot.AlignedData }) {
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      // Disable native legend — Chart.Legend owns toggles via setSeries
      legend: { show: false },
      series: [
        {},
        { label: "Sine", stroke: "#0ea5e9", width: 2 },
        { label: "Cosine", stroke: "#f97316", width: 2 },
      ],
    }),
    [],
  );

  return (
    <Chart data={data} options={options}>
      <Chart.Legend />
    </Chart>
  );
}`,

	"brush-stream-lock": `import { Chart, useBrushStreamPolicy, streamingWindow } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";

const CAPACITY = 120;

export function BrushStreamLockChart() {
  const [data, setData] = useState<uPlot.AlignedData>(/* seed */);
  const tick = useRef(CAPACITY);
  const dataRef = useRef(data);
  dataRef.current = data;

  // One owner for X: live follow XOR brush inspect.
  const policy = useBrushStreamPolicy();

  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
      cursor: policy.inspect
        ? { drag: { setScale: true, x: true, y: false } }
        : { drag: { setScale: false, x: false, y: false } },
    }),
    [policy.inspect],
  );

  useEffect(() => {
    const id = setInterval(() => {
      const t = ++tick.current;
      setData((prev) =>
        streamingWindow({
          buffer: prev,
          chunk: [[t], [Math.sin(t / 9) * 8]],
          capacity: CAPACITY,
        }),
      );
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (policy.inspect) policy.exitInspect();
          else {
            const xs = dataRef.current[0] as number[];
            policy.enterInspect({ xMin: xs[0]!, xMax: xs[xs.length - 1]! });
          }
        }}
      >
        {policy.inspect ? "Resume live follow" : "Inspect (lock window)"}
      </button>
      <Chart data={data} options={options} streaming={policy.streaming}>
        <Chart.Brush {...policy.brush} />
      </Chart>
    </>
  );
}`,

	"streaming-typed": `import { Chart, streamingWindow } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";

const CAPACITY = 200;

export function StreamingTypedChart() {
  const [data, setData] = useState<Float64Array[]>(() => {
    const x = Float64Array.from({ length: CAPACITY }, (_, i) => i);
    return [x, Float64Array.from(x, (i) => Math.sin(i / 9) * 8)];
  });
  const tick = useRef(CAPACITY);

  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
    }),
    [],
  );

  useEffect(() => {
    const id = setInterval(() => {
      const t = ++tick.current;
      setData((prev) =>
        streamingWindow({
          buffer: prev,
          chunk: [Float64Array.of(t), Float64Array.of(Math.sin(t / 9) * 8)],
          capacity: CAPACITY,
          typed: true,
        }) as Float64Array[],
      );
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <Chart
      data={data as uPlot.AlignedData}
      options={options}
      streaming={{ enabled: true, follow: true }}
    />
  );
}`,

	"worker-window": `import { Chart, streamingWindowTransferable } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";

// Same API as streamingWindow({ typed: true }) — columns stay Float64Array.
// For a real Worker off the paint thread, see @ruplot/experiments createDataWorker,
// or the Plugins → Worker stats demo (plugin-owned Worker + draw overlay).

const CAPACITY = 160;

export function WorkerWindowChart() {
  const [data, setData] = useState<Float64Array[]>(() => {
    const x = Float64Array.from({ length: CAPACITY }, (_, i) => i);
    return [x, Float64Array.from(x, (i) => Math.sin(i / 9) * 8)];
  });
  const tick = useRef(CAPACITY);

  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#a855f7", width: 2 }],
    }),
    [],
  );

  useEffect(() => {
    const id = setInterval(() => {
      const t = ++tick.current;
      setData(
        (prev) =>
          streamingWindowTransferable({
            buffer: prev,
            chunk: [Float64Array.of(t), Float64Array.of(Math.sin(t / 9) * 8)],
            capacity: CAPACITY,
            typed: true,
          }) as Float64Array[],
      );
    }, 300);
    return () => clearInterval(id);
  }, []);

  return (
    <Chart
      data={data as uPlot.AlignedData}
      options={options}
      streaming={{ enabled: true, follow: true }}
    />
  );
}`,

	"plugin-worker": `import { Chart, createPlugin, type RuplotPlugin } from "@ruplot/react";
import { useMemo, useRef, useState } from "react";
import type uPlot from "uplot";

type Stats = { rms: number; min: number; max: number };

function createWorkerStatsPlugin(onStats: (s: Stats) => void): RuplotPlugin {
  let latest: Stats | null = null;

  return createPlugin({
    key: "worker-rolling-stats",
    uplot: {
      hooks: {
        draw: [
          (u) => {
            if (!latest) return;
            const y = u.valToPos(latest.rms, "y", true);
            u.ctx.save();
            u.ctx.setLineDash([6, 4]);
            u.ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
            u.ctx.beginPath();
            u.ctx.moveTo(u.bbox.left, y);
            u.ctx.lineTo(u.bbox.left + u.bbox.width, y);
            u.ctx.stroke();
            u.ctx.restore();
          },
        ],
      },
    },
    init({ u }) {
      // Vite / bundler-managed module Worker
      const worker = new Worker(new URL("./rolling-stats.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (e: MessageEvent<Stats & { id: number }>) => {
        latest = e.data;
        onStats(latest);
        u.redraw(false, false);
      };
      const post = () => {
        const col = u.data[1];
        if (!col) return;
        const y = Float64Array.from(col as ArrayLike<number>);
        worker.postMessage({ id: 1, y }, [y.buffer]);
      };
      u.hooks.setData = u.hooks.setData ?? [];
      u.hooks.setData.push(post);
      post();
      return () => worker.terminate();
    },
  });
}

export function PluginWorkerChart({ data }: { data: uPlot.AlignedData }) {
  const onStats = useRef((_s: Stats) => {});
  const plugins = useMemo(() => [createWorkerStatsPlugin((s) => onStats.current(s))], []);
  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
    }),
    [],
  );
  return <Chart data={data} options={options} plugins={plugins} />;
}`,

	"axis-slots": `import { Chart } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";

const data: uPlot.AlignedData = [/* x */, /* y in kW */];

export function AxisSlotsChart() {
  const [unit, setUnit] = useState<"kw" | "mw">("kw");
  const [decimals, setDecimals] = useState(1);
  const [ready, setReady] = useState(0);

  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { label: "Load", stroke: "#0ea5e9", width: 2 }],
      axes: [
        {},
        {
          label: unit === "mw" ? "MW" : "kW",
          values: (_u, splits) =>
            splits.map((v) => {
              const scaled = unit === "mw" ? v / 1000 : v;
              return \`\${scaled.toFixed(decimals)} \${unit === "mw" ? "MW" : "kW"}\`;
            }),
        },
      ],
    }),
    [unit, decimals],
  );

  return (
    <>
      <button type="button" onClick={() => setUnit((u) => (u === "kw" ? "mw" : "kw"))}>
        Unit: {unit}
      </button>
      <button type="button" onClick={() => setDecimals((d) => (d >= 3 ? 0 : d + 1))}>
        Decimals: {decimals}
      </button>
      <span>onReady: {ready}</span>
      <Chart data={data} options={options} onReady={() => setReady((n) => n + 1)} />
    </>
  );
}`,

	"multi-brush": `import { Chart, type TimeRange } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";

export function MultiBrushExample({ data }: { data: uPlot.AlignedData }) {
  const [xRange, setXRange] = useState<TimeRange>({ min: 60, max: 160 });
  const [yRange, setYRange] = useState<TimeRange>({ min: 14, max: 28 });

  const overviewX = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 90,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#64748b", width: 1 }],
      cursor: { drag: { setScale: false, x: false, y: false } },
    }),
    [],
  );

  const detailA = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 150,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
    }),
    [],
  );

  const detailB = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 150,
      scales: {
        x: { time: false, min: xRange.min, max: xRange.max },
        y: { time: false },
      },
      legend: { show: false },
      series: [{}, { stroke: "#a855f7", width: 2 }],
    }),
    [xRange.min, xRange.max],
  );

  return (
    <>
      <Chart data={data} options={overviewX}>
        <Chart.Brush
          value={xRange}
          onChange={setXRange}
          bindScale={false}
          grips
          panBand
          showSelect={false}
        />
      </Chart>

      <Chart.SyncGroup id="multi-brush">
        <Chart data={data} options={detailA}>
          <Chart.Brush value={xRange} onChange={setXRange} />
        </Chart>
        {/* One brush per chart — Y only here; X comes from shared xRange in options */}
        <Chart data={data} options={detailB}>
          <Chart.Brush value={yRange} onChange={setYRange} scaleKey="y" />
        </Chart>
      </Chart.SyncGroup>

      <Chart data={data} options={{ ...overviewX, height: 120, series: [{}, { stroke: "#a855f7" }] }}>
        <Chart.Brush
          value={yRange}
          onChange={setYRange}
          orientation="y"
          scaleKey="y"
          bindScale={false}
          grips
          panBand
          showSelect={false}
        />
      </Chart>
    </>
  );
}`,

	"ssr-hydrate": `import { Chart, createChartStores } from "@ruplot/react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type uPlot from "uplot";

const data: uPlot.AlignedData = [/* x */, /* y */];

function CursorHud({ stores }: { stores: ReturnType<typeof createChartStores> }) {
  const snap = useSyncExternalStore(
    stores.cursor.subscribe,
    stores.cursor.getSnapshot,
    stores.cursor.getServerSnapshot,
  );
  return <div>idx={snap.idx ?? "—"}</div>;
}

export function SsrHydrateChart() {
  const stores = useMemo(() => createChartStores(), []);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const options = useMemo<uPlot.Options>(
    () => ({
      width: 720,
      height: 260,
      scales: { x: { time: false } },
      legend: { show: false },
      series: [{}, { stroke: "#0ea5e9", width: 2 }],
    }),
    [],
  );

  return (
    <>
      {/* HUD works before Chart mounts — same stores instance */}
      <CursorHud stores={stores} />
      {hydrated ? <Chart data={data} options={options} stores={stores} /> : null}
    </>
  );
}`,
} as const satisfies Record<string, string>;

