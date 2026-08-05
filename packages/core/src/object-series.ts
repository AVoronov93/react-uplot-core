import type uPlot from "uplot";

export type ObjectSeriesRenderArgs<T> = {
	u: uPlot;
	seriesIdx: number;
	ctx: CanvasRenderingContext2D;
	idx: number;
	/** Canvas-pixel x (matches u.bbox space). */
	x: number;
	/** Canvas-pixel y from display series value. */
	y: number;
	value: T;
};

export type ObjectSeriesPathsOptions<T> = {
	/** Read rich value for a data index (alarms, events, colored markers). */
	get: (dataIdx: number, seriesIdx: number) => T | null | undefined;
	/** Custom canvas draw for each visible point. */
	render: (args: ObjectSeriesRenderArgs<T>) => void;
};

/**
 * PathBuilder for non-numeric / object Y series.
 * Display AlignedData still needs numeric y (for scales); `get` supplies the rich payload.
 */
export function objectSeriesPaths<T>(opts: ObjectSeriesPathsOptions<T>): uPlot.Series.PathBuilder {
	return (u, seriesIdx, idx0, idx1) => {
		const xData = u.data[0];
		if (!xData) return null;

		const series = u.series[seriesIdx];
		const scaleX = u.series[0]?.scale ?? "x";
		const scaleY = series?.scale ?? "y";
		const yData = u.data[seriesIdx] as ArrayLike<number | null | undefined> | undefined;
		const ctx = u.ctx;

		for (let i = idx0; i <= idx1; i++) {
			const value = opts.get(i, seriesIdx);
			if (value == null) continue;
			const xv = xData[i];
			if (xv == null) continue;

			const yv = yData?.[i];
			const yNum = yv == null || Number.isNaN(yv) ? 0 : Number(yv);

			opts.render({
				u,
				seriesIdx,
				ctx,
				idx: i,
				x: u.valToPos(Number(xv), scaleX, true),
				y: u.valToPos(yNum, scaleY, true),
				value,
			});
		}

		// Custom draw only — no stroke/fill path for uPlot to finish.
		return null;
	};
}
