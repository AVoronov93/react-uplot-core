import type uPlot from "uplot";
import { describe, expect, it } from "vitest";
import { classifyOptions } from "./classifier.js";
import { dataChanged } from "./data.js";

const baseOptions = (): uPlot.Options => ({
	width: 400,
	height: 200,
	series: [{}, { label: "a", stroke: "red" }],
	scales: {
		x: { time: false },
		y: {},
	},
});

const dataA: uPlot.AlignedData = [
	[0, 1, 2],
	[1, 2, 3],
];

const dataB: uPlot.AlignedData = [
	[0, 1, 2],
	[1, 2, 4],
];

describe("dataChanged", () => {
	it("returns false for identical references", () => {
		expect(dataChanged(dataA, dataA)).toBe(false);
	});

	it("returns true when a series reference changes", () => {
		expect(dataChanged(dataA, dataB)).toBe(true);
	});

	it("returns false when series refs match even if nested values differ conceptually", () => {
		const sharedX = dataA[0]!;
		const sharedY = dataA[1]!;
		const twin: uPlot.AlignedData = [sharedX, sharedY];
		expect(dataChanged(dataA, twin)).toBe(false);
	});
});

describe("classifyOptions", () => {
	it("recreates on first paint", () => {
		const result = classifyOptions({
			prevOptions: null,
			nextOptions: baseOptions(),
			prevData: null,
			nextData: dataA,
		});
		expect(result.kind).toBe("recreate");
		expect(result.commands[0]?.type).toBe("recreate");
	});

	it("emits setSize when only dimensions change", () => {
		const prev = baseOptions();
		const next = { ...prev, width: 800 };
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.commands).toEqual([{ type: "setSize", width: 800, height: 200 }]);
	});

	it("emits setData when series refs change", () => {
		const opts = baseOptions();
		const result = classifyOptions({
			prevOptions: opts,
			nextOptions: opts,
			prevData: dataA,
			nextData: dataB,
			resetScales: false,
		});
		expect(result.commands).toEqual([{ type: "setData", data: dataB, resetScales: false }]);
	});

	it("emits setScale for min/max-only scale edits", () => {
		const prev = baseOptions();
		const next: uPlot.Options = {
			...prev,
			scales: {
				...prev.scales,
				y: { ...(prev.scales?.y ?? {}), min: 0, max: 10 },
			},
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.kind).toBe("scales");
		expect(result.commands).toEqual([{ type: "setScale", key: "y", min: 0, max: 10 }]);
	});

	it("patches series stroke without recreate", () => {
		const prev = baseOptions();
		const next: uPlot.Options = {
			...prev,
			series: [{}, { label: "a", stroke: "blue" }],
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.kind).toBe("seriesVisual");
		expect(result.commands).toEqual([{ type: "patchSeries", index: 1, opts: { stroke: "blue" } }]);
	});

	it("patches series stroke when legend is a new object with same values", () => {
		const prev: uPlot.Options = {
			...baseOptions(),
			legend: { show: false },
			series: [{}, { stroke: "#0ea5e9", width: 2 }],
		};
		const next: uPlot.Options = {
			...prev,
			legend: { show: false },
			series: [{}, { stroke: "#f97316", width: 2 }],
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.kind).toBe("seriesVisual");
		expect(result.commands).toEqual([
			{ type: "patchSeries", index: 1, opts: { stroke: "#f97316" } },
		]);
	});

	it("ignores hooks identity (slotted)", () => {
		const prev = baseOptions();
		const next: uPlot.Options = {
			...prev,
			hooks: { setCursor: [() => {}] },
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.kind).toBe("none");
	});

	it("ignores axis values formatter identity (slotted)", () => {
		const prev: uPlot.Options = {
			...baseOptions(),
			axes: [{ values: () => [] }],
		};
		const next: uPlot.Options = {
			...prev,
			axes: [{ values: () => ["a"] }],
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.kind).toBe("none");
	});

	it("ignores axis label identity (slotted)", () => {
		const prev: uPlot.Options = {
			...baseOptions(),
			axes: [{}, { label: "kW" }],
		};
		const next: uPlot.Options = {
			...prev,
			axes: [{}, { label: "MW" }],
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.kind).toBe("none");
	});

	it("recreates when axis side changes (structural)", () => {
		const prev: uPlot.Options = {
			...baseOptions(),
			axes: [{ side: 0 }],
		};
		const next: uPlot.Options = {
			...prev,
			axes: [{ side: 1 }],
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.kind).toBe("recreate");
	});

	it("emits setSeries for show toggles", () => {
		const prev = baseOptions();
		const next: uPlot.Options = {
			...prev,
			series: [{}, { label: "a", stroke: "red", show: false }],
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result.commands).toEqual([{ type: "setSeries", index: 1, opts: { show: false } }]);
	});

	it("returns none when nothing changed", () => {
		const opts = baseOptions();
		const result = classifyOptions({
			prevOptions: opts,
			nextOptions: opts,
			prevData: dataA,
			nextData: dataA,
		});
		expect(result).toEqual({ kind: "none", commands: [] });
	});
});
