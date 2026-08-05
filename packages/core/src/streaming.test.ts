import type uPlot from "uplot";
import { describe, expect, it } from "vitest";
import { streamingWindow } from "./data.js";
import { captureRuntimeSnapshot, restoreRuntimeSnapshot } from "./runtime-snapshot.js";
import { normalizeStreaming, streamingResetScales } from "./streaming.js";

describe("streamingWindow", () => {
	it("appends and trims to capacity", () => {
		const buffer = [
			[0, 1, 2],
			[10, 11, 12],
		] as uPlot.AlignedData;
		const chunk = [
			[3, 4],
			[13, 14],
		] as uPlot.AlignedData;
		const next = streamingWindow({ buffer, chunk, capacity: 4 });
		expect(Array.from(next[0] as ArrayLike<number>)).toEqual([1, 2, 3, 4]);
		expect(Array.from(next[1] as ArrayLike<number>)).toEqual([11, 12, 13, 14]);
	});

	it("preserves typed streaming columns when requested", () => {
		const buffer = [
			new Float64Array([0, 1, 2]),
			new Float32Array([10, 11, 12]),
		] as unknown as uPlot.AlignedData;
		const chunk = [
			new Float64Array([3, 4]),
			new Float32Array([13, 14]),
		] as unknown as uPlot.AlignedData;
		const next = streamingWindow({ buffer, chunk, capacity: 4, typed: true });

		expect(next[0]).toBeInstanceOf(Float64Array);
		expect(next[1]).toBeInstanceOf(Float64Array);
		expect(Array.from(next[0] as ArrayLike<number>)).toEqual([1, 2, 3, 4]);
		expect(Array.from(next[1] as ArrayLike<number>)).toEqual([11, 12, 13, 14]);
	});
});

describe("streamingResetScales", () => {
	it("defaults to preserving scales when streaming is enabled", () => {
		expect(streamingResetScales(true)).toBe(false);
		expect(streamingResetScales({ enabled: true })).toBe(false);
		expect(streamingResetScales(false)).toBe(true);
		expect(streamingResetScales(true, true)).toBe(true);
	});

	it("normalizes boolean shorthand", () => {
		expect(normalizeStreaming(true)).toEqual({
			enabled: true,
			resetScales: false,
			follow: true,
		});
	});
});

describe("runtime snapshot types", () => {
	it("exports callable helpers", () => {
		expect(typeof captureRuntimeSnapshot).toBe("function");
		expect(typeof restoreRuntimeSnapshot).toBe("function");
	});
});
