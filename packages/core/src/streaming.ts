import type uPlot from "uplot";

export type StreamingMode = {
	enabled: boolean;
	/** When enabled, defaults to false (preserve zoom). */
	resetScales?: boolean;
	/** After setData, set x scale to full data extent (scrolling window). */
	follow?: boolean;
};

export type StreamingConfig = boolean | StreamingMode;

export function normalizeStreaming(input: StreamingConfig | undefined): StreamingMode {
	if (input == null || input === false) {
		return { enabled: false };
	}
	if (input === true) {
		return { enabled: true, resetScales: false, follow: true };
	}
	return {
		enabled: input.enabled,
		resetScales: input.resetScales ?? false,
		follow: input.follow ?? true,
	};
}

/** Effective resetScales flag for setData under streaming policy. */
export function streamingResetScales(
	streaming: StreamingConfig | undefined,
	explicit?: boolean,
): boolean {
	if (explicit !== undefined) return explicit;
	const mode = normalizeStreaming(streaming);
	if (!mode.enabled) return true;
	return mode.resetScales ?? false;
}

/**
 * Point x-scale at the current display window (first..last x).
 * Used after setData(false) so sliding windows visually scroll.
 */
export function followXScale(instance: uPlot, data: uPlot.AlignedData): void {
	const x = data[0];
	if (!x || x.length === 0) return;
	const min = x[0];
	const max = x[x.length - 1];
	if (min == null || max == null || min === max) return;
	instance.setScale("x", { min: Number(min), max: Number(max) });
}
