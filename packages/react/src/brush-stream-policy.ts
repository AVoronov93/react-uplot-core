import { useState } from "react";
import type { StreamingMode } from "@ruplot/core";
import type { BrushProps, TimeRange } from "./brush.js";

export type BrushStreamPolicyOptions = {
	/** Initial inspect mode (brush owns X, follow paused). @default false */
	initialInspect?: boolean;
	/** Initial brush range. */
	initialRange?: TimeRange | null;
};

export type BrushStreamPolicy = {
	/** True while the user is inspecting / brushing (follow paused). */
	inspect: boolean;
	setInspect: (next: boolean) => void;
	/**
	 * Pause follow and enable brush. Pass current x extent to seed a trailing window.
	 */
	enterInspect: (args?: { xMin: number; xMax: number; span?: number }) => void;
	/** Resume live follow and disable brush application. */
	exitInspect: () => void;
	toggleInspect: () => void;
	range: TimeRange | null;
	setRange: (range: TimeRange) => void;
	/** Spread onto `<Chart streaming={…} />`. */
	streaming: StreamingMode;
	/** Spread onto `<Chart.Brush … />`. */
	brush: Pick<BrushProps, "disabled" | "grips" | "panBand" | "showSelect"> & {
		value: TimeRange | null;
		onChange: (range: TimeRange) => void;
	};
};

/**
 * Coordinates `streaming.follow` and `Chart.Brush` so they never both own X.
 *
 * - Live: follow on, brush disabled.
 * - Inspect: follow off, brush grips/pan enabled.
 */
export function useBrushStreamPolicy(
	options: BrushStreamPolicyOptions = {},
): BrushStreamPolicy {
	const [inspect, setInspect] = useState(options.initialInspect ?? false);
	const [range, setRange] = useState<TimeRange | null>(options.initialRange ?? null);

	const enterInspect = (args?: { xMin: number; xMax: number; span?: number }) => {
		if (args) {
			const fullSpan = Math.max(args.xMax - args.xMin, 1);
			const span = args.span ?? Math.max(20, Math.min(fullSpan * 0.45, fullSpan));
			setRange({ min: args.xMax - span, max: args.xMax });
		}
		setInspect(true);
	};

	return {
		inspect,
		setInspect,
		enterInspect,
		exitInspect: () => setInspect(false),
		toggleInspect: () => setInspect((v) => !v),
		range,
		setRange,
		streaming: { enabled: true, follow: !inspect, resetScales: false },
		brush: {
			value: range,
			onChange: setRange,
			disabled: !inspect,
			grips: inspect,
			panBand: inspect,
			showSelect: false,
		},
	};
}
