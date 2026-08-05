import type uPlot from "uplot";

export const LARGE_POINTS_DEFAULT = 10_000_000;
export const GEN_CHUNK = 250_000;

export function readPointCount(fallback: number): number {
	if (typeof window === "undefined") return fallback;
	const params = new URLSearchParams(window.location.search);
	const raw = params.get("points");
	if (!raw) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function generateLargeData(
	n: number,
	onProgress?: (done: number) => void,
): Promise<uPlot.AlignedData> {
	const x = new Float64Array(n);
	const y = new Float64Array(n);

	for (let start = 0; start < n; start += GEN_CHUNK) {
		const end = Math.min(n, start + GEN_CHUNK);
		for (let i = start; i < end; i++) {
			x[i] = i;
			y[i] = Math.sin(i / 120_000) * 40 + Math.sin(i / 7_000) * 12 + (Math.random() - 0.5) * 6;
		}
		onProgress?.(end);
		await new Promise<void>((r) => setTimeout(r, 0));
	}

	return [x, y];
}

/** Sliding-window buffer filled with a sine-like signal. */
export function makeStreamBuffer(capacity: number): uPlot.AlignedData {
	const x = new Float64Array(capacity);
	const y = new Float64Array(capacity);
	for (let i = 0; i < capacity; i++) {
		x[i] = i;
		y[i] = Math.sin(i / 18) * 12 + Math.sin(i / 7) * 3;
	}
	return [x, y];
}

export function advanceStreamBuffer(data: uPlot.AlignedData, tick: number): void {
	const x = data[0] as Float64Array;
	const y = data[1] as Float64Array;
	const last = x.length - 1;
	x.copyWithin(0, 1);
	y.copyWithin(0, 1);
	x[last] = x[last - 1]! + 1;
	y[last] = Math.sin((tick + x.length) / 18) * 12 + Math.sin((tick + x.length) / 7) * 3;
}
