import type uPlot from "uplot";

/**
 * Dual-read data plane: uPlot sees `display`, tooltips/plugins read `source`.
 * Replaces app-level WeakMap hacks for stack-fit / normalized series.
 */
export type DataPlane<T = unknown> = {
	readonly display: uPlot.AlignedData;
	readonly source: readonly (readonly T[] | null)[];
	getSource: (seriesIdx: number, dataIdx: number) => T | null;
};

export type DualDataParams<T> = {
	/** Shared x column. */
	x: ArrayLike<number>;
	/** Parallel source series (index 0 unused / mirrors uPlot series[0] spacer). */
	source: readonly (readonly T[] | null)[];
	/** Map source value → y number for display (null = gap). */
	toY: (value: T, seriesIdx: number, dataIdx: number) => number | null;
};

export function createDataPlane<T = unknown>(args: {
	display: uPlot.AlignedData;
	source?: readonly (readonly T[] | null)[];
}): DataPlane<T> {
	const source = args.source ?? [];
	return {
		display: args.display,
		source,
		getSource(seriesIdx, dataIdx) {
			const series = source[seriesIdx];
			if (!series) return null;
			return series[dataIdx] ?? null;
		},
	};
}

/**
 * Build display AlignedData from rich source rows while keeping originals readable.
 */
export function dualData<T>(params: DualDataParams<T>): DataPlane<T> {
	const { x, source, toY } = params;
	const len = x.length;
	const xOut = Array.from({ length: len }, (_, i) => Number(x[i]));
	const yOut: (number | null)[][] = [];

	// source[0] is typically null (x spacer), matching uPlot series layout.
	for (let s = 0; s < source.length; s++) {
		const series = source[s];
		if (s === 0 || !series) {
			yOut.push([]);
			continue;
		}
		const col: (number | null)[] = Array.from({ length: len }, (_, i) => {
			const value = series[i];
			if (value === undefined || value === null) return null;
			return toY(value as T, s, i);
		});
		yOut.push(col);
	}

	// display: [x, y1, y2, ...] — skip empty spacer column at 0
	const displayCols: uPlot.AlignedData[number][] = [xOut];
	for (let s = 1; s < yOut.length; s++) {
		displayCols.push(yOut[s] as number[]);
	}

	return createDataPlane({
		display: displayCols as uPlot.AlignedData,
		source,
	});
}
