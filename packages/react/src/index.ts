/**
 * Stable public API for `@ruplot/react`.
 *
 * Advanced / experimental helpers live in `@ruplot/react/unstable`
 * (or import from `@ruplot/core` directly).
 */
import { AutoSize as AutoSizeComponent, type AutoSizeProps } from "./auto-size.js";
import { Brush as BrushComponent } from "./brush.js";
import {
	Chart as ChartComponent,
	type ChartProps,
	type ChartRef,
	type ChartSyncProps,
} from "./chart.js";
import { Legend as LegendComponent, type LegendProps } from "./legend.js";
import {
	SyncGroup as SyncGroupComponent,
	type SyncGroupContextValue,
	type SyncGroupHandle,
	type SyncGroupProps,
	useSyncGroup,
	useSyncGroupContext,
} from "./sync-group.js";
import {
	Tooltip as TooltipComponent,
	type TooltipProps,
	type TooltipRenderProps,
} from "./tooltip.js";
import { usePlugin } from "./use-plugin.js";

export type { ChartProps, ChartRef, ChartSyncProps };
export type { ChartHandle } from "./context.js";
export { useChartHandle } from "./context.js";
export {
	useUPlot,
	useCursor,
	useScales,
	useSeries,
	useSelection,
	useSync,
} from "./hooks.js";
export { Brush, type BrushProps, type TimeRange } from "./brush.js";
export {
	useBrushStreamPolicy,
	type BrushStreamPolicy,
	type BrushStreamPolicyOptions,
} from "./brush-stream-policy.js";
export { AutoSizeComponent as AutoSize, type AutoSizeProps };
export { LegendComponent as Legend, type LegendProps };
export { SyncGroupComponent as SyncGroup, useSyncGroup, useSyncGroupContext };
export type { SyncGroupProps, SyncGroupHandle, SyncGroupContextValue };
export { TooltipComponent as Tooltip, type TooltipProps, type TooltipRenderProps };
export { usePlugin };

/** App-facing helpers (stable). Engine/advanced APIs: `@ruplot/react/unstable` or `@ruplot/core`. */
export {
	streamingWindow,
	seriesStepped,
	holdForwardGaps,
	holdForwardAligned,
	dualData,
	createChartStores,
	thresholdPlugin,
	objectSeriesPaths,
	createPlugin,
	batchStores,
} from "@ruplot/core";
/** @deprecated Use {@link batchStores}. */
export { batchStores as batchUpdates } from "@ruplot/core";
export type {
	DualDataParams,
	StreamingWindowParams,
	RuplotPlugin,
	RuplotPluginContext,
	RuplotPluginCleanup,
	ThresholdPluginOptions,
	ObjectSeriesPathsOptions,
	ObjectSeriesRenderArgs,
	CursorSnapshot,
	ScalesSnapshot,
	ScaleRange,
	SelectSnapshot,
	SeriesVisibilitySnapshot,
	SyncSnapshot,
	StreamingConfig,
	StreamingMode,
	ChartStores,
	DataPlane,
	SessionDebugSnapshot,
	SessionCommandStats,
	ChartDebugConfig,
} from "@ruplot/core";

/**
 * Declarative chart + composition slots.
 */
export const Chart = Object.assign(ChartComponent, {
	Plot: ChartComponent,
	Brush: BrushComponent,
	SyncGroup: SyncGroupComponent,
	Tooltip: TooltipComponent,
	AutoSize: AutoSizeComponent,
	Legend: LegendComponent,
});
