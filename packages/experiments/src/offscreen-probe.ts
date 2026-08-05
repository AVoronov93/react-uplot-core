/**
 * OffscreenCanvas capability probe.
 *
 * Finding (documented): uPlot is **DOM-coupled** (root, .u-over, axes, legend).
 * You cannot drop a full uPlot instance onto OffscreenCanvas in a Worker without
 * a substantial fork. The useful Worker path for ruplot is **data prep**, not
 * relocating the chart paint loop.
 */
export type OffscreenProbeResult = {
	offscreenCanvasCtor: boolean;
	transferControlToOffscreen: boolean;
	/** True when Worker + OffscreenCanvas APIs exist in this realm. */
	workerOffscreenLikely: boolean;
	/** Always true — library policy / finding. */
	uplotDomCoupled: true;
	notes: string[];
};

export function probeOffscreenCanvas(
	globalObj: typeof globalThis = globalThis,
): OffscreenProbeResult {
	const notes: string[] = [];
	const offscreenCanvasCtor =
		typeof (globalObj as { OffscreenCanvas?: unknown }).OffscreenCanvas === "function";
	if (!offscreenCanvasCtor) {
		notes.push("OffscreenCanvas constructor missing in this realm.");
	}

	let transferControlToOffscreen = false;
	try {
		const doc = (globalObj as { document?: Document }).document;
		if (doc?.createElement) {
			const canvas = doc.createElement("canvas");
			transferControlToOffscreen =
				typeof (canvas as HTMLCanvasElement & { transferControlToOffscreen?: unknown })
					.transferControlToOffscreen === "function";
		} else {
			notes.push("No document — cannot probe HTMLCanvasElement.transferControlToOffscreen.");
		}
	} catch (err) {
		notes.push(`transferControlToOffscreen probe failed: ${String(err)}`);
	}

	if (!transferControlToOffscreen && offscreenCanvasCtor) {
		notes.push("OffscreenCanvas exists but canvas transfer is unavailable.");
	}

	notes.push(
		"uPlot builds a DOM tree (root / overlay / axes). Full Worker charting needs a fork; use data Workers instead.",
	);

	return {
		offscreenCanvasCtor,
		transferControlToOffscreen,
		workerOffscreenLikely: offscreenCanvasCtor,
		uplotDomCoupled: true,
		notes,
	};
}
