import type uPlot from "uplot";
import type { ChartCommand, SeriesPatch, SeriesVisualPatch } from "./commands.js";
import { dataChanged } from "./data.js";

export type OptionChangeKind =
	| "none"
	| "data"
	| "size"
	| "scales"
	| "seriesVisibility"
	| "seriesVisual"
	| "recreate";

export type ClassifyInput = {
	prevOptions: uPlot.Options | null;
	nextOptions: uPlot.Options;
	prevData: uPlot.AlignedData | null;
	nextData: uPlot.AlignedData;
	resetScales?: boolean;
};

export type ClassifyResult = {
	kind: OptionChangeKind;
	commands: ChartCommand[];
};

/** Compared with Object.is — primitives and function refs. */
const STRUCTURAL_REF_KEYS = [
	"mode",
	"title",
	"id",
	"class",
	"pxAlign",
	"tzDate",
	"fmtDate",
] as const;

/** Compared by value — inline objects must not force recreate when content is unchanged. */
const STRUCTURAL_VALUE_KEYS = [
	"cursor",
	"focus",
	"legend",
	"bands",
	"select",
	"drawOrder",
] as const;

function optionObjectEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (a === undefined && b === undefined) return true;
	if (a === null || b === null || a === undefined || b === undefined) return false;
	if (typeof a !== typeof b) return false;
	if (typeof a !== "object") return Object.is(a, b);
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((v, i) => optionObjectEqual(v, b[i]));
	}
	if (Array.isArray(a) || Array.isArray(b)) return false;

	const aObj = a as Record<string, unknown>;
	const bObj = b as Record<string, unknown>;
	const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
	for (const key of keys) {
		if (!optionObjectEqual(aObj[key], bObj[key])) return false;
	}
	return true;
}

function pluginsEqual(
	prev: uPlot.Options["plugins"] | undefined,
	next: uPlot.Options["plugins"] | undefined,
): boolean {
	if (prev === next) return true;
	if (!prev || !next) return prev === next;
	if (prev.length !== next.length) return false;
	return prev.every((p, i) => p === next[i]);
}

function structuralOptionsChanged(prev: uPlot.Options, next: uPlot.Options): boolean {
	for (const key of STRUCTURAL_REF_KEYS) {
		if (!Object.is(prev[key], next[key])) return true;
	}
	for (const key of STRUCTURAL_VALUE_KEYS) {
		if (!optionObjectEqual(prev[key], next[key])) return true;
	}
	if (!pluginsEqual(prev.plugins, next.plugins)) return true;
	return false;
}

/** Series keys that patch in place (mutate + redraw). */
const SERIES_VISUAL_KEYS = ["stroke", "width", "dash", "fill", "spanGaps"] as const;

/** Axis keys slotted via session.setUserAxes — identity changes must not recreate. */
export const AXIS_SLOTTED_KEYS = ["values", "splits", "space", "filter", "label"] as const;

function axesNeedsRecreate(
	prev: uPlot.Options["axes"] | undefined,
	next: uPlot.Options["axes"] | undefined,
): boolean {
	if (prev === next) return false;
	if (!prev || !next) return prev !== next;
	if (prev.length !== next.length) return true;

	for (let i = 0; i < prev.length; i++) {
		const a = prev[i];
		const b = next[i];
		if (a === b) continue;
		if (!a || !b) return true;

		const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
		for (const key of keys) {
			if ((AXIS_SLOTTED_KEYS as readonly string[]).includes(key)) continue;
			if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
				return true;
			}
		}
	}
	return false;
}

/** Series keys that still require recreate (paths/scale/points factories, …). */
function seriesNeedsRecreate(
	prev: uPlot.Options["series"] | undefined,
	next: uPlot.Options["series"] | undefined,
): boolean {
	if (prev === next) return false;
	if (!prev || !next) return prev !== next;
	if (prev.length !== next.length) return true;

	for (let i = 0; i < prev.length; i++) {
		const a = prev[i];
		const b = next[i];
		if (a === b) continue;
		if (!a || !b) return true;

		const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
		for (const key of keys) {
			if (key === "show" || key === "focus") continue;
			if ((SERIES_VISUAL_KEYS as readonly string[]).includes(key)) continue;
			if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
				return true;
			}
		}
	}
	return false;
}

function collectSeriesVisualPatches(
	prev: uPlot.Options["series"] | undefined,
	next: uPlot.Options["series"] | undefined,
): ChartCommand[] {
	if (!prev || !next || prev.length !== next.length) return [];
	const commands: ChartCommand[] = [];

	for (let i = 0; i < next.length; i++) {
		const a = prev[i];
		const b = next[i];
		if (!a || !b || a === b) continue;

		const opts: SeriesVisualPatch = {};
		let changed = false;
		for (const key of SERIES_VISUAL_KEYS) {
			if (!Object.is(a[key], b[key]) && b[key] !== undefined) {
				(opts as Record<string, unknown>)[key] = b[key];
				changed = true;
			}
		}
		if (changed) {
			commands.push({ type: "patchSeries", index: i, opts });
		}
	}
	return commands;
}

function collectSeriesVisibility(
	prev: uPlot.Options["series"] | undefined,
	next: uPlot.Options["series"] | undefined,
): ChartCommand[] {
	if (!prev || !next || prev.length !== next.length) return [];

	const commands: ChartCommand[] = [];
	for (let i = 0; i < next.length; i++) {
		const a = prev[i];
		const b = next[i];
		if (!a || !b) continue;

		const opts: SeriesPatch = {};
		let changed = false;

		if (!Object.is(a.show, b.show) && b.show !== undefined) {
			opts.show = b.show;
			changed = true;
		}

		if (changed) {
			commands.push({ type: "setSeries", index: i, opts });
		}
	}

	return commands;
}

function collectScaleCommands(
	prev: uPlot.Options["scales"] | undefined,
	next: uPlot.Options["scales"] | undefined,
): { commands: ChartCommand[]; structural: boolean } {
	if (prev === next) return { commands: [], structural: false };
	if (!prev || !next) return { commands: [], structural: prev !== next };

	const prevKeys = Object.keys(prev);
	const nextKeys = Object.keys(next);
	if (prevKeys.length !== nextKeys.length) {
		return { commands: [], structural: true };
	}

	const commands: ChartCommand[] = [];

	for (const key of nextKeys) {
		const a = prev[key];
		const b = next[key];
		if (a === b) continue;
		if (!a || !b) return { commands: [], structural: true };

		const { min: aMin, max: aMax, ...aRest } = a;
		const { min: bMin, max: bMax, ...bRest } = b;

		const restKeys = new Set([...Object.keys(aRest), ...Object.keys(bRest)]);
		for (const restKey of restKeys) {
			if (
				!Object.is(
					(aRest as Record<string, unknown>)[restKey],
					(bRest as Record<string, unknown>)[restKey],
				)
			) {
				return { commands: [], structural: true };
			}
		}

		if (!Object.is(aMin, bMin) || !Object.is(aMax, bMax)) {
			commands.push({
				type: "setScale",
				key,
				min: bMin ?? null,
				max: bMax ?? null,
			});
		}
	}

	return { commands, structural: false };
}

/**
 * Classify option/data transitions into the cheapest safe command list.
 */
export function classifyOptions(input: ClassifyInput): ClassifyResult {
	const { prevOptions, nextOptions, prevData, nextData, resetScales = true } = input;
	const commands: ChartCommand[] = [];

	if (prevOptions === null) {
		return {
			kind: "recreate",
			commands: [{ type: "recreate", options: nextOptions, data: nextData, preserveRuntime: true }],
		};
	}

	if (prevOptions !== nextOptions) {
		if (structuralOptionsChanged(prevOptions, nextOptions)) {
			return {
				kind: "recreate",
				commands: [
					{ type: "recreate", options: nextOptions, data: nextData, preserveRuntime: true },
				],
			};
		}

		if (seriesNeedsRecreate(prevOptions.series, nextOptions.series)) {
			return {
				kind: "recreate",
				commands: [
					{ type: "recreate", options: nextOptions, data: nextData, preserveRuntime: true },
				],
			};
		}

		if (axesNeedsRecreate(prevOptions.axes, nextOptions.axes)) {
			return {
				kind: "recreate",
				commands: [
					{ type: "recreate", options: nextOptions, data: nextData, preserveRuntime: true },
				],
			};
		}

		const scaleResult = collectScaleCommands(prevOptions.scales, nextOptions.scales);
		if (scaleResult.structural) {
			return {
				kind: "recreate",
				commands: [
					{ type: "recreate", options: nextOptions, data: nextData, preserveRuntime: true },
				],
			};
		}
		commands.push(...scaleResult.commands);
		commands.push(...collectSeriesVisibility(prevOptions.series, nextOptions.series));
		commands.push(...collectSeriesVisualPatches(prevOptions.series, nextOptions.series));

		const widthChanged = !Object.is(prevOptions.width, nextOptions.width);
		const heightChanged = !Object.is(prevOptions.height, nextOptions.height);
		if (widthChanged || heightChanged) {
			commands.push({
				type: "setSize",
				width: nextOptions.width,
				height: nextOptions.height,
			});
		}
	}

	if (prevData === null || dataChanged(prevData, nextData)) {
		commands.push({
			type: "setData",
			data: nextData,
			...(resetScales === false ? { resetScales: false } : { resetScales: true }),
		});
	}

	if (commands.length === 0) {
		return { kind: "none", commands };
	}

	const kinds = new Set(commands.map((c) => c.type));
	if (kinds.has("setData") && kinds.size === 1) {
		return { kind: "data", commands };
	}
	if (kinds.has("setScale") && ![...kinds].some((k) => k !== "setScale" && k !== "setData")) {
		return { kind: "scales", commands };
	}
	if (kinds.has("setSeries") && ![...kinds].some((k) => k !== "setSeries" && k !== "setData")) {
		return { kind: "seriesVisibility", commands };
	}
	if (
		kinds.has("patchSeries") &&
		![...kinds].some((k) => k !== "patchSeries" && k !== "setData" && k !== "setSeries")
	) {
		return { kind: "seriesVisual", commands };
	}
	if (kinds.has("setSize")) {
		return { kind: "size", commands };
	}

	return { kind: "data", commands };
}
