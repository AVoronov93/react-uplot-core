import { act, renderHook } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { describe, expect, it, vi } from "vitest";
import { useStreamingSeries } from "./use-streaming-series.js";

describe("useStreamingSeries", () => {
	it("push appends and respects capacity (drops oldest)", () => {
		const { result } = renderHook(() =>
			useStreamingSeries({ capacity: 3, series: 1, typed: true }),
		);

		act(() => {
			result.current.push([1, 10]);
			result.current.push([2, 20]);
			result.current.push([3, 30]);
			result.current.push([4, 40]);
		});

		const x = result.current.data[0]!;
		const y = result.current.data[1]!;
		expect(x.length).toBe(3);
		expect(Array.from(x as Float64Array)).toEqual([2, 3, 4]);
		expect(Array.from(y as Float64Array)).toEqual([20, 30, 40]);
	});

	it("pushMany appends a chunk", () => {
		const { result } = renderHook(() =>
			useStreamingSeries({ capacity: 10, series: 1, typed: false }),
		);

		act(() => {
			result.current.pushMany([
				[1, 2],
				[10, 20],
			]);
		});

		expect(result.current.data[0]).toEqual([1, 2]);
		expect(result.current.data[1]).toEqual([10, 20]);
	});

	it("push throws on wrong arity", () => {
		const { result } = renderHook(() => useStreamingSeries({ capacity: 5, series: 2 }));
		expect(() => result.current.push([1, 2])).toThrow(/expected 3 values/);
	});

	it("reset clears the window", () => {
		const { result } = renderHook(() => useStreamingSeries({ capacity: 5 }));
		act(() => {
			result.current.push([1, 1]);
			result.current.reset();
		});
		expect(result.current.data[0]!.length).toBe(0);
	});

	it("flush calls setData on a bound chart instance", () => {
		const setData = vi.fn();
		const setScale = vi.fn();
		const { result } = renderHook(() => useStreamingSeries({ capacity: 5, follow: true }));

		(
			result.current.chartRef as MutableRefObject<{
				getInstance: () => { setData: typeof setData; setScale: typeof setScale };
			} | null>
		).current = {
			getInstance: () => ({ setData, setScale }),
		};

		act(() => {
			result.current.push([1, 2]);
			result.current.push([2, 3]);
		});

		expect(setData).toHaveBeenCalled();
		expect(setData.mock.calls.at(-1)?.[1]).toBe(false);
		expect(setScale).toHaveBeenCalled();
	});
});
