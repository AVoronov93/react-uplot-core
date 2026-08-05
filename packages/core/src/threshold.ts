import type uPlot from "uplot";
import uPlotLib from "uplot";
import { createPlugin, type RuplotPlugin } from "./plugin-runtime.js";

export type ThresholdPluginOptions = {
	/** Override stable key (default encodes scale + y). */
	key?: string;
	/** Threshold value in scale space. */
	y: number;
	scaleKey?: string;
	stroke?: string;
	lineWidth?: number;
	dash?: number[];
};

/**
 * Horizontal threshold line drawn in the uPlot paint cycle.
 * App supplies the value/color — library owns valToPos + stroke cleanup.
 */
export function thresholdPlugin(opts: ThresholdPluginOptions): RuplotPlugin {
	const scaleKey = opts.scaleKey ?? "y";
	const stroke = opts.stroke ?? "#ef4444";
	const lineWidth = opts.lineWidth ?? 1;
	const dash = opts.dash;

	return createPlugin({
		key: opts.key ?? `threshold:${scaleKey}:${opts.y}`,
		uplot: {
			hooks: {
				draw: [
					(u) => {
						const scale = u.scales[scaleKey];
						if (!scale || scale.min == null || scale.max == null) return;
						if (opts.y < scale.min || opts.y > scale.max) return;

						const y = u.valToPos(opts.y, scaleKey, true);
						const { left, width } = u.bbox;
						const ctx = u.ctx;
						const px = uPlotLib.pxRatio;

						ctx.save();
						ctx.beginPath();
						ctx.strokeStyle = stroke;
						ctx.lineWidth = lineWidth * px;
						if (dash && dash.length > 0) {
							ctx.setLineDash(dash.map((d) => d * px));
						}
						ctx.moveTo(left, y);
						ctx.lineTo(left + width, y);
						ctx.stroke();
						ctx.restore();
					},
				],
			},
		},
	});
}
