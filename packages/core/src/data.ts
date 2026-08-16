import type uPlot from "uplot";

/**
 * Reference-first data equality.
 *
 * WHY: deep-comparing millions of points on the React render path is a
 * guaranteed frame budget violation. Streaming callers must pass a new
 * series reference (or call setData via the handle).
 */
export function dataChanged(prev: uPlot.AlignedData, next: uPlot.AlignedData): boolean {
	if (prev === next) return false;
	if (prev.length !== next.length) return true;

	for (let i = 0; i < prev.length; i++) {
		if (prev[i] !== next[i]) return true;
	}

	return false;
}

type ColumnFingerprint = { length: number; head: number; mid: number; tail: number };

const columnFingerprints = new WeakMap<object, ColumnFingerprint>();

function fingerprintColumn(col: uPlot.AlignedData[number]): ColumnFingerprint | null {
	if (col == null || typeof col !== "object") return null;
	const length = col.length;
	if (length === 0) return { length: 0, head: 0, mid: 0, tail: 0 };
	const head = Number(col[0] ?? 0);
	const mid = Number(col[length >> 1] ?? 0);
	const tail = Number(col[length - 1] ?? 0);
	return { length, head, mid, tail };
}

/**
 * Dev-only: warn when an AlignedData column is mutated in place (same ref, new contents).
 * Hot path stays reference-only via {@link dataChanged}; this is a safety net for mistakes.
 */
export function warnIfDataMutatedInPlace(data: uPlot.AlignedData): void {
	if (typeof process !== "undefined" && process.env.NODE_ENV === "production") return;

	for (let i = 0; i < data.length; i++) {
		const col = data[i];
		if (col == null || typeof col !== "object") continue;
		const next = fingerprintColumn(col);
		if (!next) continue;
		const key = col as object;
		const prev = columnFingerprints.get(key);
		if (
			prev &&
			(prev.length !== next.length ||
				prev.head !== next.head ||
				prev.mid !== next.mid ||
				prev.tail !== next.tail)
		) {
			console.warn(
				`[ruplot] AlignedData column ${i} was mutated in place. Treat columns as immutable: pass a new series reference, use streamingWindow, or useStreamingSeries().push (imperative setData). Mutating the same array and relying on React props will miss updates and trip this warning.`,
			);
		}
		columnFingerprints.set(key, next);
	}
}

export type StreamingWindowParams = {
	/** Existing window columns. */
	buffer: uPlot.AlignedData;
	/** New samples to append (same series count). */
	chunk: uPlot.AlignedData;
	/** Max points kept in the window. */
	capacity: number;
	/**
	 * Preserve a typed-data pipeline by returning Float64Array columns when
	 * the corresponding buffer column is a typed array.
	 */
	typed?: boolean;
};

/**
 * Append `chunk` into a fixed-capacity sliding window.
 * Returns new column arrays (immutable-friendly for React props).
 */
export function streamingWindow({
	buffer,
	chunk,
	capacity,
	typed = false,
}: StreamingWindowParams): uPlot.AlignedData {
	if (buffer.length !== chunk.length) {
		throw new Error("streamingWindow: buffer and chunk series count must match");
	}
	if (capacity <= 0) {
		throw new Error("streamingWindow: capacity must be > 0");
	}

	const columns: uPlot.AlignedData[number][] = [];

	for (let s = 0; s < buffer.length; s++) {
		const dest = buffer[s]!;
		const src = chunk[s]!;

		if (typed && isTypedArray(dest)) {
			const combined = new Float64Array(dest.length + src.length);
			combined.set(dest);
			combined.set(src as ArrayLike<number>, dest.length);
			columns.push(
				(combined.length > capacity
					? combined.slice(combined.length - capacity)
					: combined) as uPlot.AlignedData[number],
			);
			continue;
		}

		const combined = toNumberArray(dest).concat(toNumberArray(src));
		columns.push(
			combined.length > capacity ? combined.slice(combined.length - capacity) : combined,
		);
	}

	return columns as uPlot.AlignedData;
}

/** Alias for worker-friendly streaming pipelines. */
export const streamingWindowTransferable = streamingWindow;

function toNumberArray(col: uPlot.AlignedData[number]): number[] {
	if (Array.isArray(col)) return col as number[];
	return Array.from(col as ArrayLike<number>);
}

function isTypedArray(col: uPlot.AlignedData[number]): col is Float64Array {
	return ArrayBuffer.isView(col) && !(col instanceof DataView);
}
