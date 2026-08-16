import { followXScale, streamingWindow } from "@ruplot/core";
import { useCallback, useMemo, useRef } from "react";
import type uPlot from "uplot";
import type { ChartRef } from "./chart.js";

export type UseStreamingSeriesOptions = {
	/** Max points kept in the sliding window. */
	capacity: number;
	/**
	 * Number of Y series (total AlignedData columns = 1 + series).
	 * @default 1
	 */
	series?: number;
	/**
	 * Prefer Float64Array columns (matches stream-60 demos).
	 * @default true
	 */
	typed?: boolean;
	/**
	 * After each push, set x scale to the data window (streaming.follow).
	 * @default true
	 */
	follow?: boolean;
	/** Seed data; length may be less than capacity. */
	initial?: uPlot.AlignedData;
};

export type StreamingSeries = {
	/**
	 * Current window for `<Chart data={stream.data} />`.
	 *
	 * Runtime: **getter** on the returned object (`get data()` → `dataRef.current`).
	 * `push` / `pushMany` / `reset` update the ref and call imperative
	 * `chartRef.current.getInstance()?.setData(…, false)` — no React `setState`,
	 * so they do not re-render the Chart tree. Parent re-renders (unrelated state)
	 * may pass a newer buffer identity into Chart once; that is classify/`setData`,
	 * not a render loop.
	 */
	readonly data: uPlot.AlignedData;
	capacity: number;
	/** Pass to `<Chart ref={stream.chartRef} … streaming />`. */
	chartRef: React.RefObject<ChartRef | null>;
	/** Append one sample: `[x, y0, y1, …]`. */
	push: (point: ArrayLike<number>) => void;
	/** Append a chunk (same series count as the buffer). */
	pushMany: (chunk: uPlot.AlignedData) => void;
	/** Clear to an empty window (keeps capacity / series shape). */
	reset: () => void;
};

/**
 * Fixed-capacity streaming buffer that stays off the React commit path.
 *
 * @example
 * ```tsx
 * const stream = useStreamingSeries({ capacity: 3000 });
 * useEffect(() => {
 *   const id = setInterval(() => {
 *     stream.push([Date.now() / 1000, Math.random()]);
 *   }, 16);
 *   return () => clearInterval(id);
 * }, [stream]);
 * return <Chart ref={stream.chartRef} data={stream.data} options={options} streaming />;
 * ```
 */
export function useStreamingSeries(options: UseStreamingSeriesOptions): StreamingSeries {
	const capacity = options.capacity;
	const series = options.series ?? 1;
	const typed = options.typed ?? true;
	const follow = options.follow ?? true;

	const chartRef = useRef<ChartRef | null>(null);
	const dataRef = useRef<uPlot.AlignedData>(
		options.initial ?? emptyBuffer(capacity, series, typed),
	);
	const followRef = useRef(follow);
	followRef.current = follow;
	const capacityRef = useRef(capacity);
	capacityRef.current = capacity;
	const typedRef = useRef(typed);
	typedRef.current = typed;

	const flush = useCallback((next: uPlot.AlignedData) => {
		dataRef.current = next;
		const u = chartRef.current?.getInstance() ?? null;
		if (!u) return;
		u.setData(next, false);
		if (followRef.current) followXScale(u, next);
	}, []);

	const push = useCallback(
		(point: ArrayLike<number>) => {
			const cols = 1 + series;
			if (point.length !== cols) {
				throw new Error(
					`useStreamingSeries.push: expected ${cols} values (x + ${series} y), got ${point.length}`,
				);
			}
			const chunk = pointToChunk(point, cols, typedRef.current);
			const next = streamingWindow({
				buffer: dataRef.current,
				chunk,
				capacity: capacityRef.current,
				typed: typedRef.current,
			});
			flush(next);
		},
		[flush, series],
	);

	const pushMany = useCallback(
		(chunk: uPlot.AlignedData) => {
			const next = streamingWindow({
				buffer: dataRef.current,
				chunk,
				capacity: capacityRef.current,
				typed: typedRef.current,
			});
			flush(next);
		},
		[flush],
	);

	const reset = useCallback(() => {
		const next = emptyBuffer(capacityRef.current, series, typedRef.current);
		flush(next);
	}, [flush, series]);

	return useMemo(
		() => ({
			get data() {
				return dataRef.current;
			},
			capacity,
			chartRef,
			push,
			pushMany,
			reset,
		}),
		[capacity, push, pushMany, reset],
	);
}

function emptyBuffer(capacity: number, series: number, typed: boolean): uPlot.AlignedData {
	void capacity;
	const cols: uPlot.AlignedData[number][] = [];
	for (let i = 0; i < 1 + series; i++) {
		cols.push(typed ? new Float64Array(0) : []);
	}
	return cols as uPlot.AlignedData;
}

function pointToChunk(point: ArrayLike<number>, cols: number, typed: boolean): uPlot.AlignedData {
	const chunk: uPlot.AlignedData[number][] = [];
	for (let i = 0; i < cols; i++) {
		const v = Number(point[i]);
		chunk.push(typed ? Float64Array.of(v) : [v]);
	}
	return chunk as uPlot.AlignedData;
}
