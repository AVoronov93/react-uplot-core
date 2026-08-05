import type uPlot from "uplot";

export const POINT_COUNT = 2_000;
export const SERIES_COUNT = 2;

/** Deterministic aligned dataset for fair comparisons. */
export function makeData(points = POINT_COUNT, seed = 1): uPlot.AlignedData {
	const x = new Float64Array(points);
	const ys: Float64Array[] = Array.from({ length: SERIES_COUNT }, () => new Float64Array(points));

	let s = seed;
	const rand = () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 0xffffffff;
	};

	for (let i = 0; i < points; i++) {
		x[i] = i;
		for (let sIdx = 0; sIdx < SERIES_COUNT; sIdx++) {
			ys[sIdx]![i] = Math.sin(i / 25 + sIdx) * 10 + rand() * 2;
		}
	}

	return [x, ...ys];
}

/** Mutate trailing window for streaming without reallocating columns when possible. */
export function advanceStream(data: uPlot.AlignedData, tick: number): uPlot.AlignedData {
	const x = data[0] as Float64Array;
	const points = x.length;
	const nextX = new Float64Array(points);
	const nextYs = data.slice(1).map((col) => {
		const src = col as Float64Array;
		const out = new Float64Array(points);
		out.set(src.subarray(1));
		out[points - 1] = Math.sin((tick + points) / 25) * 10 + ((tick * 17) % 100) / 50;
		return out;
	});

	nextX.set(x.subarray(1));
	nextX[points - 1] = x[points - 1]! + 1;

	return [nextX, ...nextYs];
}

export function makeOptions(width = 800, height = 320): uPlot.Options {
	return {
		width,
		height,
		scales: { x: { time: false } },
		axes: [{}, {}],
		series: [
			{},
			{ label: "A", stroke: "#0ea5e9", width: 1 },
			{ label: "B", stroke: "#f97316", width: 1 },
		],
		legend: { show: false },
	};
}
