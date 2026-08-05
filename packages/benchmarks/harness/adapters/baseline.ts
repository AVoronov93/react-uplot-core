import uPlot from "uplot";
import type { ChartAdapter } from "./types";

export function createBaselineAdapter(): ChartAdapter {
	let instance: uPlot | null = null;
	let lastOptions: uPlot.Options | null = null;

	return {
		id: "baseline",
		mount({ host, options, data }) {
			instance?.destroy();
			host.replaceChildren();
			lastOptions = options;
			instance = new uPlot(options, data, host);
			return () => {
				instance?.destroy();
				instance = null;
				host.replaceChildren();
			};
		},
		updateData(data, resetScales = true) {
			instance?.setData(data, resetScales);
		},
		setSize(width, height) {
			instance?.setSize({ width, height });
			if (lastOptions) {
				lastOptions = { ...lastOptions, width, height };
			}
		},
		setScale(key, min, max) {
			instance?.setScale(key, { min, max });
		},
		setCursor(left, top) {
			instance?.setCursor({ left, top });
		},
		getInstance: () => instance,
	};
}
