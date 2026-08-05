import uPlot from "uplot";
import type { ApplyResult, ChartCommand, SeriesVisualPatch } from "./commands.js";
import type { DataPlane } from "./data-plane.js";
import {
	type PluginRuntime,
	type RuplotPlugin,
	createPluginRuntime,
} from "./plugin-runtime.js";
import { captureRuntimeSnapshot, restoreRuntimeSnapshot } from "./runtime-snapshot.js";
import { type ChartStores, createChartStores } from "./stores.js";

export type ChartSessionOptions = {
	target: HTMLElement;
	options: uPlot.Options;
	data: uPlot.AlignedData;
	/** Optional pre-created stores so React hooks can subscribe before mount. */
	stores?: ChartStores;
	/** Dual-read plane; tooltips/plugins read source while uPlot uses display. */
	dataPlane?: DataPlane | null;
	/** Imperative plugins (init/destroy); native uplot hooks merged by the host. */
	plugins?: readonly RuplotPlugin[];
};

export type ChartSession = {
	readonly stores: ChartStores;
	readonly getInstance: () => uPlot | null;
	/** Mutable dual-read plane (stack-fit / normalized display). */
	dataPlane: DataPlane | null;
	/** Replace plugin list; diffs by key and re-inits after recreate. */
	setPlugins: (plugins: readonly RuplotPlugin[]) => void;
	/** Update slotted user hooks without recreate (classifier ignores hooks identity). */
	setUserHooks: (hooks: uPlot.Options["hooks"] | undefined) => void;
	/**
	 * Patch axis formatters (values / splits / space / filter) in place.
	 * Redraws only when a slotted field identity actually changes.
	 */
	setUserAxes: (axes: uPlot.Options["axes"] | undefined) => void;
	apply: (commands: readonly ChartCommand[]) => ApplyResult;
	destroy: () => void;
};

type HookSlots = { current: uPlot.Options["hooks"] | undefined };

type SeriesRuntime = uPlot.Series & {
	_stroke?: CanvasRenderingContext2D["strokeStyle"] | null;
	_fill?: CanvasRenderingContext2D["fillStyle"] | null;
	_paths?: unknown;
	points?: NonNullable<uPlot.Series["points"]> & {
		_stroke?: CanvasRenderingContext2D["strokeStyle"] | null;
		_fill?: CanvasRenderingContext2D["fillStyle"] | null;
	};
};

/** uPlot normalizes stroke/fill to accessors at init — raw assigns break redraw. */
function asSeriesAccessor<T>(value: T): (self: uPlot, seriesIdx: number) => T extends (...args: never[]) => infer R ? R : T {
	return (typeof value === "function" ? value : () => value) as (
		self: uPlot,
		seriesIdx: number,
	) => T extends (...args: never[]) => infer R ? R : T;
}

function patchSeriesVisuals(series: SeriesRuntime, opts: SeriesVisualPatch): void {
	if (opts.stroke !== undefined) {
		const stroke = asSeriesAccessor(opts.stroke);
		series.stroke = stroke;
		series._stroke = null;
		if (series.points) {
			series.points.stroke = stroke;
			series.points._stroke = null;
		}
	}
	if (opts.fill !== undefined) {
		const fill = asSeriesAccessor(opts.fill);
		series.fill = fill;
		series._fill = null;
		if (series.points) {
			series.points.fill = fill;
			series.points._fill = null;
		}
	}
	if (opts.width !== undefined) {
		series.width = opts.width;
		series._paths = null;
		if (series.points) (series.points as { _paths?: unknown })._paths = null;
	}
	if (opts.dash !== undefined) {
		series.dash = opts.dash;
	}
	if (opts.spanGaps !== undefined) {
		series.spanGaps = opts.spanGaps;
		series._paths = null;
	}
}

const AXIS_SLOTTED = ["values", "splits", "space", "filter", "label"] as const;

function readScales(instance: uPlot): Record<string, { min: number | null; max: number | null }> {
	const out: Record<string, { min: number | null; max: number | null }> = {};
	for (const key of Object.keys(instance.scales)) {
		const scale = instance.scales[key];
		if (!scale) continue;
		out[key] = {
			min: scale.min ?? null,
			max: scale.max ?? null,
		};
	}
	return out;
}

function syncStoresFromInstance(stores: ChartStores, instance: uPlot): void {
	stores.scales.replace(readScales(instance));
	stores.series.replace({
		show: instance.series.map((s) => s.show !== false),
		focus: instance.series.map(() => undefined),
	});
	stores.selection.replace({
		left: instance.select.left,
		top: instance.select.top,
		width: instance.select.width,
		height: instance.select.height,
	});
	stores.meta.setState({ ready: true, version: stores.meta.getSnapshot().version + 1 });
}

function attachHooks(
	stores: ChartStores,
	options: uPlot.Options,
	slots: HookSlots,
): uPlot.Options {
	slots.current = options.hooks;

	const runUser = (name: keyof uPlot.Hooks.Arrays, u: uPlot) => {
		const list = slots.current?.[name] as Array<(chart: uPlot) => void> | undefined;
		if (!list) return;
		for (const fn of list) fn(u);
	};

	return {
		...options,
		hooks: {
			setCursor: [
				(u) => {
					runUser("setCursor", u);
					stores.cursor.setState({
						idx: u.cursor.idx ?? null,
						idxs: u.cursor.idxs ?? null,
						left: u.cursor.left ?? -10,
						top: u.cursor.top ?? -10,
					});
				},
			],
			setScale: [
				(u) => {
					runUser("setScale", u);
					stores.scales.setState(readScales(u));
				},
			],
			setSelect: [
				(u) => {
					runUser("setSelect", u);
					stores.selection.setState({
						left: u.select.left,
						top: u.select.top,
						width: u.select.width,
						height: u.select.height,
					});
				},
			],
			setSeries: [
				(u) => {
					runUser("setSeries", u);
					stores.series.setState({
						show: u.series.map((s) => s.show !== false),
						focus: u.series.map(() => undefined),
					});
				},
			],
			ready: [(u) => runUser("ready", u)],
			draw: [(u) => runUser("draw", u)],
			destroy: [(u) => runUser("destroy", u)],
		},
	};
}

/**
 * Mutable owner of a uPlot instance. React (or any host) should keep this in a ref.
 */
export function createChartSession(init: ChartSessionOptions): ChartSession {
	const stores = init.stores ?? createChartStores();
	const sizeScratch = { width: 0, height: 0 };
	const pluginRuntime: PluginRuntime = createPluginRuntime();
	const hookSlots: HookSlots = { current: init.options.hooks };
	let pluginList: readonly RuplotPlugin[] = init.plugins ?? [];

	let instance: uPlot | null = null;
	let destroyed = false;
	let session!: ChartSession;

	const bindPlugins = () => {
		if (!instance) return;
		pluginRuntime.sync(pluginList, { u: instance, session });
	};

	const create = (options: uPlot.Options, data: uPlot.AlignedData, preserveRuntime = true) => {
		const snap = preserveRuntime && instance ? captureRuntimeSnapshot(instance) : null;
		pluginRuntime.destroy();
		instance?.destroy();
		hookSlots.current = options.hooks;
		instance = new uPlot(attachHooks(stores, options, hookSlots), data, init.target);
		if (snap) restoreRuntimeSnapshot(instance, snap);
		syncStoresFromInstance(stores, instance);
		if (session) bindPlugins();
	};

	create(init.options, init.data, false);

	const applyOne = (command: ChartCommand): boolean => {
		if (!instance && command.type !== "recreate") {
			return false;
		}

		switch (command.type) {
			case "recreate": {
				create(command.options, command.data, command.preserveRuntime ?? true);
				return true;
			}
			case "setData": {
				const reset = command.resetScales ?? true;
				instance!.setData(command.data, reset);
				if (!reset) {
					instance!.redraw();
				}
				return false;
			}
			case "setSize": {
				sizeScratch.width = command.width;
				sizeScratch.height = command.height;
				instance!.setSize(sizeScratch);
				return false;
			}
			case "setScale": {
				instance!.setScale(command.key, {
					min: command.min as number,
					max: command.max as number,
				});
				return false;
			}
			case "setSeries": {
				instance!.setSeries(command.index, command.opts);
				return false;
			}
			case "patchSeries": {
				const series = instance!.series[command.index] as SeriesRuntime | undefined;
				if (series) {
					patchSeriesVisuals(series, command.opts);
					instance!.redraw();
				}
				return false;
			}
			case "setCursor": {
				instance!.setCursor({ left: command.left, top: command.top });
				return false;
			}
			case "setSelect": {
				instance!.setSelect(command.select);
				return false;
			}
			case "batch": {
				let recreated = false;
				for (const child of command.commands) {
					recreated = applyOne(child) || recreated;
				}
				return recreated;
			}
			default: {
				const _exhaustive: never = command;
				return _exhaustive;
			}
		}
	};

	session = {
		stores,
		getInstance: () => instance,
		dataPlane: init.dataPlane ?? null,
		setPlugins(plugins) {
			pluginList = plugins;
			bindPlugins();
		},
		setUserHooks(hooks) {
			hookSlots.current = hooks;
		},
		setUserAxes(axes) {
			if (!instance || !axes) return;
			let dirty = false;
			const n = Math.min(axes.length, instance.axes.length);
			for (let i = 0; i < n; i++) {
				const src = axes[i];
				const dst = instance.axes[i];
				if (!src || !dst) continue;
				for (const key of AXIS_SLOTTED) {
					const next = (src as Record<string, unknown>)[key];
					if (next === undefined) continue;
					if (!Object.is((dst as Record<string, unknown>)[key], next)) {
						(dst as Record<string, unknown>)[key] = next;
						(dst as Record<string, unknown>)._values = null;
						(dst as Record<string, unknown>)._splits = null;
						dirty = true;
					}
				}
			}
			if (dirty) instance.redraw(false, true);
		},
		apply(commands) {
			if (destroyed) {
				return { recreated: false, applied: [] };
			}
			let recreated = false;
			for (const command of commands) {
				recreated = applyOne(command) || recreated;
			}
			return { recreated, applied: commands };
		},
		destroy() {
			if (destroyed) return;
			destroyed = true;
			pluginRuntime.destroy();
			instance?.destroy();
			instance = null;
			stores.meta.setState({ ready: false, version: stores.meta.getSnapshot().version + 1 });
		},
	};

	bindPlugins();
	return session;
}
