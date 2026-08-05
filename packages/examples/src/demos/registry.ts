import { AutoSizeDemo } from "./auto-size.js";
import { AxisSlotsDemo } from "./axis-slots.js";
import { BasicDemo } from "./basic.js";
import { BrushPanYDemo } from "./brush-pan-y.js";
import { BrushStreamLockDemo } from "./brush-stream-lock.js";
import { BrushDemo } from "./brush.js";
import { ClassifierDemo } from "./classifier.js";
import { CursorRichDemo } from "./cursor-rich.js";
import { CustomPluginDemo } from "./custom-plugin.js";
import { DualDataDemo } from "./dual-data.js";
import { EventsDemo } from "./events.js";
import { GapsSteppedDemo } from "./gaps-stepped.js";
import { HooksDemo } from "./hooks.js";
import { LargeResizeStreamDemo } from "./large-resize-stream.js";
import { LargeResizeDemo } from "./large-resize.js";
import { LargeDataDemo } from "./large.js";
import { LegendDemo } from "./legend.js";
import { MultiBrushDemo } from "./multi-brush.js";
import { PluginWorkerDemo } from "./plugin-worker.js";
import { ResizePreserveDemo } from "./resize-preserve.js";
import { SeriesVisualDemo } from "./series-visual.js";
import { SsrHydrateDemo } from "./ssr-hydrate.js";
import { StreamPolicyDemo } from "./stream-policy.js";
import { StreamingTypedDemo } from "./streaming-typed.js";
import { StreamingWindowDemo } from "./streaming-window.js";
import { StreamingDemo } from "./streaming.js";
import { SyncDemo } from "./sync.js";
import { ThresholdDemo } from "./threshold.js";
import { TooltipDemo } from "./tooltip.js";
import { CATEGORY_ORDER, type DemoCategory, type DemoEntry, type DemoId } from "./types.js";
import { USAGE } from "./usage-snippets.js";
import { WorkerWindowDemo } from "./worker-window.js";

export type { DemoCategory, DemoEntry, DemoId };
export { CATEGORY_ORDER };

export const DEMOS: readonly DemoEntry[] = [
	{
		id: "basic",
		title: "Basic mount",
		category: "Getting started",
		blurb: "Declarative <Chart data options /> with a stable options object.",
		why: "Thin wrappers stop here. ruplot uses the same props surface, then routes updates through a classifier so later demos stay cheap.",
		pattern: USAGE.basic,
		pitfalls: [
			"Inline options={{...}} every render can force recreate — keep a stable reference when possible.",
			'Import "uplot/dist/uPlot.min.css".',
		],
		Component: BasicDemo,
	},
	{
		id: "hooks",
		title: "Hooks without chart re-renders",
		category: "Getting started",
		blurb: "useCursor / useScales subscribe via external stores.",
		why: "uplot-react often puts cursor in React state and re-renders the tree. ruplot Context holds a stable handle; reactivity is useSyncExternalStore.",
		pattern: USAGE.hooks,
		pitfalls: [
			"Hooks must run under <Chart> (or Chart.Plot).",
			"Do not mirror cursor into useState for hot paths.",
		],
		Component: HooksDemo,
	},
	{
		id: "streaming",
		title: "Streaming 60Hz",
		category: "Updates",
		blurb: "Imperative setData on a sliding window with ~0 React re-renders.",
		why: "Benchmarks: competitors pay ~119 React commits / 2s; ruplot stays at 0 while FPS matches raw uPlot.",
		pattern: USAGE.streaming,
		pitfalls: [
			"setData(false) without redraw/scale follow looks frozen — follow x via setScale each tick.",
			"Putting the buffer in useState forces commits — keep it in a ref.",
		],
		Component: StreamingDemo,
	},
	{
		id: "large",
		title: "Large data (multi-million)",
		category: "Updates",
		blurb: "Mount millions of points; zoom with setScale on the same arrays.",
		why: "Proves the hot path is imperative uPlot work, not React reconciliation.",
		pattern: USAGE.large,
		pitfalls: ["Use ?points=1000000 if memory is tight.", "Avoid cloning arrays each zoom."],
		Component: LargeDataDemo,
	},
	{
		id: "large-resize",
		title: "Large + resize",
		category: "Updates",
		blurb:
			"Large series with a drag-resize frame (↘) and setScale pan; FPS shows setSize cost live.",
		why: "ResizeObserver + huge series is the production footgun — classifier keeps setSize so pan/zoom survive.",
		pattern: USAGE["large-resize"],
		pitfalls: ["Keep options.series stable; only width/height should change for setSize."],
		Component: LargeResizeDemo,
	},
	{
		id: "large-resize-stream",
		title: "Large + resize + stream",
		category: "Updates",
		blurb: "Large sliding window @ 60Hz plus drag-resize; FPS + React commits while streaming.",
		why: "Combines the three hot paths: imperative setData, setSize, setScale follow — React stays quiet.",
		pattern: USAGE["large-resize-stream"],
		pitfalls: ["Do not put the sliding buffer in React state each tick."],
		Component: LargeResizeStreamDemo,
	},
	{
		id: "resize-preserve",
		title: "Resize preserves zoom",
		category: "Updates",
		blurb: "Width/height changes classify as setSize; runtime state survives.",
		why: "Production footgun #1: ResizeObserver → new options → full recreate wipes brush/zoom. ruplot snapshots on recreate and prefers setSize.",
		pattern: USAGE["resize-preserve"],
		pitfalls: ["Rebuilding series:[] identity each render can still recreate — memoize options."],
		Component: ResizePreserveDemo,
	},
	{
		id: "classifier",
		title: "Option classifier",
		category: "Updates",
		blurb: "See setData vs setSize vs recreate for the same Toggle.",
		why: "The differentiator vs dumping options into useEffect([options, data]).",
		pattern: USAGE.classifier,
		pitfalls: [
			"paths / plugins identity / axis side / title → recreate (with preserveRuntime).",
			"series stroke/width/dash/fill/spanGaps → patchSeries (same instance).",
			"hooks + axis values/splits/space/filter are slotted — identity ignored.",
		],
		Component: ClassifierDemo,
	},
	{
		id: "series-visual",
		title: "Series visual patch",
		category: "Updates",
		blurb: "Patch a changing stroke without recreating the chart.",
		why: "Visual series updates should preserve the canvas instance and avoid flicker.",
		pattern: USAGE["series-visual"],
		pitfalls: ["Keep structural options stable.", "paths / points factories still recreate."],
		Component: SeriesVisualDemo,
	},
	{
		id: "auto-size",
		title: "AutoSize",
		category: "Updates",
		blurb: "ResizeObserver supplies both width and height to Chart.",
		why: "AutoSize measures the content box; classifier routes size-only updates as setSize.",
		pattern: USAGE["auto-size"],
		pitfalls: [
			"Give the observed frame explicit width and height (e.g. resize: both).",
			"Height will not change if the frame CSS only stretches horizontally.",
		],
		Component: AutoSizeDemo,
	},
	{
		id: "axis-slots",
		title: "Axis formatter slots",
		category: "Updates",
		blurb: "kW/MW unit + decimals via slotted axis formatters; structural side flip recreates.",
		why: "Formatters change every render (i18n, units). Slotting patches axes in place — like hooks.",
		pattern: USAGE["axis-slots"],
		pitfalls: [
			"side / scale / size / grid still recreate.",
			"onReady should stay at 1 while only slotted axis fields change.",
		],
		Component: AxisSlotsDemo,
	},
	{
		id: "ssr-hydrate",
		title: "SSR store hydrate",
		category: "Updates",
		blurb: "Pre-create createChartStores() for idle snapshots, pass stores={…} after hydrate.",
		why: "useSyncExternalStore needs getServerSnapshot; sharing one ChartStores instance avoids hydration mismatch.",
		pattern: USAGE["ssr-hydrate"],
		pitfalls: [
			"Create stores once (useMemo / module) — do not allocate per render.",
			"Pass the same instance to Chart stores= after the canvas mounts.",
		],
		Component: SsrHydrateDemo,
	},
	{
		id: "brush",
		title: "Brush / frame selector",
		category: "Composition",
		blurb:
			"Detail zoom + overview frame: semicircle grips, sparkline minimap in Brush children, data-space { min, max }.",
		why: "Apps stop rewriting valToPos/setSelect grips for every product — chrome stays in CSS/children.",
		pattern: USAGE.brush,
		pitfalls: [
			"Overview must use bindScale={false} or it zooms away from full history.",
			"showSelect={false} when you paint the band yourself (children / bandStyle).",
			"Sparkline is app code in Brush children — not a library export.",
			"Disable brush while streaming follow if they fight.",
		],
		Component: BrushDemo,
	},
	{
		id: "sync",
		title: "Synced cursors",
		category: "Composition",
		blurb: "Chart.SyncGroup injects cursor.sync.key and tracks peers.",
		why: "Ad-hoc uPlot.sync keys leak peers on recreate/fullscreen. Registry join/leave + rebind.",
		pattern: USAGE.sync,
		pitfalls: ["Pass sync={false} to opt out a nested chart."],
		Component: SyncDemo,
	},
	{
		id: "tooltip",
		title: "Tooltip positioning shell",
		category: "Composition",
		blurb: "Chart.Tooltip only positions; you own the card — multi-series values, deltas, i18n.",
		why: "Keeps domain HTML in the app while solving .u-over math once.",
		pattern: USAGE.tooltip,
		pitfalls: [
			"Do not put heavy React trees that re-render the Chart parent on cursor.",
			"clamp (default true) keeps the tooltip inside the Chart wrapper; pass clamp={false} to disable.",
		],
		Component: TooltipDemo,
	},
	{
		id: "brush-pan-y",
		title: "Brush pan + Y",
		category: "Composition",
		blurb: "Pan an X overview band; Y frame selector with bindScale={false}.",
		why: "Grips track data min/max (Y-inverted CSS); panBand moves the window without resizing.",
		pattern: USAGE["brush-pan-y"],
		pitfalls: [
			"Overview / Y selectors need bindScale={false} or grips stick to the plot edges.",
			"Y range must sit inside the auto-scaled data extent.",
		],
		Component: BrushPanYDemo,
	},
	{
		id: "cursor-rich",
		title: "Per-series cursor values",
		category: "Composition",
		blurb: "useCursor() gives idx + idxs; values come from data[s][idxs[s]].",
		why: "Lean store avoids copying series values on every pointer move; gaps can diverge idxs per series.",
		pattern: USAGE["cursor-rich"],
		pitfalls: ["Read values from data[s][idxs[s]] — the snapshot does not include Y values."],
		Component: CursorRichDemo,
	},
	{
		id: "legend",
		title: "Legend toggle",
		category: "Composition",
		blurb: "Toggle visibility through Chart.Legend.",
		why: "Visibility is an imperative series command, not an options recreation.",
		pattern: USAGE.legend,
		pitfalls: ["Keep options.legend disabled when using the React legend."],
		Component: LegendDemo,
	},
	{
		id: "brush-stream-lock",
		title: "Brush vs stream lock",
		category: "Composition",
		blurb: "useBrushStreamPolicy spreads streaming + brush so follow XOR Brush owns X.",
		why: "streaming.follow and Brush both call setScale — one helper keeps a single owner.",
		pattern: USAGE["brush-stream-lock"],
		pitfalls: [
			"Never leave follow:true and an enabled Brush on the same X scale.",
			"Prefer useBrushStreamPolicy over hand-rolled inspect flags.",
		],
		Component: BrushStreamLockDemo,
	},
	{
		id: "multi-brush",
		title: "Multi brush",
		category: "Composition",
		blurb: "Shared X overview + two details; Y brush on one chart only.",
		why: "Compose ranges without stacking multiple Brush overlays on one chart.",
		pattern: USAGE["multi-brush"],
		pitfalls: [
			"One Brush per chart — use options.scales.x for shared X on the Y-zoom detail.",
			"Overview selectors need bindScale={false}.",
		],
		Component: MultiBrushDemo,
	},
	{
		id: "dual-data",
		title: "Dual-data (display vs source)",
		category: "Data",
		blurb: "Plot normalized Y; tooltip reads originals via DataPlane.",
		why: "Replaces WeakMap(uPlot → originals) hacks that break on recreate.",
		pattern: USAGE["dual-data"],
		pitfalls: ["Host owns setData; plugins must not fight the plane."],
		Component: DualDataDemo,
	},
	{
		id: "gaps-stepped",
		title: "Gaps + stepped series",
		category: "Data",
		blurb: "holdForwardGaps and seriesStepped for industrial sparse metrics.",
		why: "Same helpers every plant dashboard reimplements.",
		pattern: USAGE["gaps-stepped"],
		pitfalls: ["Raw nulls vs hold-forward is a product choice — toggle in the demo."],
		Component: GapsSteppedDemo,
	},
	{
		id: "streaming-window",
		title: "streamingWindow helper",
		category: "Data",
		blurb: "Fixed-capacity append helper + streaming prop policy.",
		why: "Keeps AlignedData windowing out of ad-hoc app utils.",
		pattern: USAGE["streaming-window"],
		pitfalls: [
			"Buffer and chunk series counts must match.",
			"This path goes through React setState — use imperative setData for 60Hz.",
		],
		Component: StreamingWindowDemo,
	},
	{
		id: "stream-policy",
		title: "streaming prop vs streamingWindow",
		category: "Data",
		blurb: "Separate buffer updates from Chart follow policy.",
		why: "Data-window and viewport policy are distinct concerns.",
		pattern: USAGE["stream-policy"],
		pitfalls: ["Use imperative setData for 60Hz."],
		Component: StreamPolicyDemo,
	},
	{
		id: "streaming-typed",
		title: "streamingWindow typed",
		category: "Data",
		blurb: "Fixed typed Float64Array window.",
		why: "Typed columns keep data pipelines efficient and transferable.",
		pattern: USAGE["streaming-typed"],
		pitfalls: ["Both buffer and chunk should be typed."],
		Component: StreamingTypedDemo,
	},
	{
		id: "worker-window",
		title: "Worker window (experiments)",
		category: "Data",
		blurb: "Worker-friendly transferable typed window.",
		why: "Heavy window work can move off the chart paint thread.",
		pattern: USAGE["worker-window"],
		pitfalls: ["Worker URLs require bundler support."],
		Component: WorkerWindowDemo,
	},
	{
		id: "threshold",
		title: "Threshold plugin",
		category: "Plugins",
		blurb: "thresholdPlugin draws a horizontal limit in hooks.draw.",
		why: "valToPos + stroke in every app → one factory with PluginRuntime lifecycle.",
		pattern: USAGE.threshold,
		pitfalls: ["plugins={[thresholdPlugin()]} each render recreates — module-level or useMemo."],
		Component: ThresholdDemo,
	},
	{
		id: "events",
		title: "Object / event markers",
		category: "Plugins",
		blurb: "objectSeriesPaths renders rich event payloads on a lane.",
		why: "Alarm timelines need objects, not fake numbers — PathBuilder factory included.",
		pattern: USAGE.events,
		pitfalls: ["Display column still needs numeric y for scales."],
		Component: EventsDemo,
	},
	{
		id: "custom-plugin",
		title: "Custom plugin lifecycle",
		category: "Plugins",
		blurb: "createPlugin init/destroy — DOM cleaned on recreate.",
		why: "useEffect plugins often orphan nodes; PluginRuntime diffs by key.",
		pattern: USAGE["custom-plugin"],
		pitfalls: ["Plugins must not call setData — host owns the data plane."],
		Component: CustomPluginDemo,
	},
	{
		id: "plugin-worker",
		title: "Plugin + Worker stats",
		category: "Plugins",
		blurb: "createPlugin owns a module Worker; draw paints RMS from off-thread stats.",
		why: "Shows how to offload work via a pluggable plugin without fighting Chart setData.",
		pattern: USAGE["plugin-worker"],
		pitfalls: [
			"Worker URLs need a bundler (Vite import.meta.url).",
			"Plugins must not call setData — host owns the data plane.",
		],
		Component: PluginWorkerDemo,
	},
];

export function getDemo(id: string | undefined): DemoEntry | undefined {
	return DEMOS.find((d) => d.id === id);
}

export function demosByCategory(): { category: DemoCategory; demos: DemoEntry[] }[] {
	return CATEGORY_ORDER.map((category) => ({
		category,
		demos: DEMOS.filter((d) => d.category === category),
	}));
}
