import type uPlot from "uplot";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dataChanged, warnIfDataMutatedInPlace } from "./data.js";

describe("warnIfDataMutatedInPlace", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("warns when the same column ref changes length/samples", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const y = [1, 2, 3];
		const data: uPlot.AlignedData = [[0, 1, 2], y];

		warnIfDataMutatedInPlace(data);
		expect(warn).not.toHaveBeenCalled();

		y[1] = 99;
		warnIfDataMutatedInPlace(data);
		expect(warn).toHaveBeenCalledOnce();
		expect(String(warn.mock.calls[0]?.[0])).toMatch(/mutated in place/);
	});

	it("does not warn when a new column reference is used", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		warnIfDataMutatedInPlace([
			[0, 1],
			[1, 2],
		]);
		warnIfDataMutatedInPlace([
			[0, 1],
			[1, 3],
		]);
		expect(warn).not.toHaveBeenCalled();
		expect(dataChanged([[0], [1]], [[0], [2]])).toBe(true);
	});
});
