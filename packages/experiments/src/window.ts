/**
 * Pure sliding-window for transferable Float64 columns.
 * Runs on main or Worker — no DOM.
 */
export type WindowColumns = {
	/** Parallel series columns (x + y…). */
	columns: Float64Array[];
};

export function streamingWindowTransferable(args: {
	buffer: Float64Array[];
	chunk: Float64Array[];
	capacity: number;
}): Float64Array[] {
	const { buffer, chunk, capacity } = args;
	if (buffer.length !== chunk.length) {
		throw new Error("streamingWindowTransferable: series count mismatch");
	}
	if (capacity <= 0) {
		throw new Error("streamingWindowTransferable: capacity must be > 0");
	}

	const out: Float64Array[] = [];
	for (let s = 0; s < buffer.length; s++) {
		const dest = buffer[s]!;
		const src = chunk[s]!;
		const combined = new Float64Array(dest.length + src.length);
		combined.set(dest, 0);
		combined.set(src, dest.length);
		if (combined.length > capacity) {
			out.push(combined.slice(combined.length - capacity));
		} else {
			out.push(combined);
		}
	}
	return out;
}
