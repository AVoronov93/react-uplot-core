import type uPlot from "uplot";
import uPlotLib from "uplot";

/**
 * stepAfter-style series defaults (industrial stepped metrics).
 */
export function seriesStepped(partial: uPlot.Series = {}): uPlot.Series {
	const stepped = uPlotLib.paths?.stepped?.({ align: 1 });
	return {
		...partial,
		...(stepped ? { paths: stepped } : {}),
	};
}

/**
 * Forward-fill null gaps (hold last value). Common for sparse industrial feeds.
 */
export function holdForwardGaps(
	values: ArrayLike<number | null | undefined>,
): (number | null)[] {
	const out: (number | null)[] = Array.from({ length: values.length }, () => null);
	let last: number | null = null;
	for (let i = 0; i < values.length; i++) {
		const v = values[i];
		if (v == null || Number.isNaN(v)) {
			out[i] = last;
		} else {
			last = v;
			out[i] = v;
		}
	}
	return out;
}

/**
 * Apply hold-forward to every y series of an AlignedData table (x untouched).
 */
export function holdForwardAligned(data: uPlot.AlignedData): uPlot.AlignedData {
	if (data.length <= 1) return data;
	const cols: uPlot.AlignedData[number][] = [data[0]!];
	for (let s = 1; s < data.length; s++) {
		cols.push(holdForwardGaps(data[s] as ArrayLike<number | null | undefined>));
	}
	return cols as uPlot.AlignedData;
}
