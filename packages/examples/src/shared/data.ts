import type uPlot from "uplot";

export function sineSeries(n: number, opts?: { amp?: number; noise?: number }): uPlot.AlignedData {
	const amp = opts?.amp ?? 10;
	const noise = opts?.noise ?? 0;
	const x = Array.from({ length: n }, (_, i) => i);
	const y = x.map(
		(i) =>
			Math.sin(i / 20) * amp +
			Math.sin(i / 7) * (amp * 0.3) +
			20 +
			(noise ? (Math.random() - 0.5) * noise : 0),
	);
	return [x, y];
}

export function sparseWithGaps(n: number): uPlot.AlignedData {
	const x = Array.from({ length: n }, (_, i) => i);
	const y = x.map((i) => {
		if (i > 12 && i < 18) return null;
		if (i > 28 && i < 34) return null;
		return Math.sin(i / 8) * 8 + 12;
	});
	return [x, y as number[]];
}

export const CHART_W = 720;
export const CHART_H = 260;
