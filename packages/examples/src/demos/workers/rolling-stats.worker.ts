/**
 * Worker for Plugin + Worker demo: rolling RMS / min / max over a Y column.
 * Bundled via Vite `new Worker(new URL(...), { type: "module" })`.
 */

export type RollingRequest = {
	id: number;
	y: Float64Array;
};

export type RollingResponse = {
	id: number;
	rms: number;
	min: number;
	max: number;
	/** Downsampled envelope for overlay (every stride-th sample). */
	envelope: Float64Array;
	stride: number;
};

self.onmessage = (event: MessageEvent<RollingRequest>) => {
	const { id, y } = event.data;
	let sumSq = 0;
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (let i = 0; i < y.length; i++) {
		const v = y[i]!;
		sumSq += v * v;
		if (v < min) min = v;
		if (v > max) max = v;
	}
	const stride = Math.max(1, Math.floor(y.length / 64));
	const envelope = new Float64Array(Math.ceil(y.length / stride));
	for (let i = 0, j = 0; i < y.length; i += stride, j++) {
		envelope[j] = y[i]!;
	}
	const res: RollingResponse = {
		id,
		rms: Math.sqrt(sumSq / Math.max(y.length, 1)),
		min: Number.isFinite(min) ? min : 0,
		max: Number.isFinite(max) ? max : 0,
		envelope,
		stride,
	};
	// Worker global postMessage — transfer the envelope buffer.
	(
		self as unknown as { postMessage: (msg: unknown, transfer: Transferable[]) => void }
	).postMessage(res, [envelope.buffer]);
};
