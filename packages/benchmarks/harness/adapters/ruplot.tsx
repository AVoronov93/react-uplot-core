import { Chart, type ChartRef } from "@ruplot/react";
import { Profiler, createElement, createRef } from "react";
import { type Root, createRoot } from "react-dom/client";
import type uPlot from "uplot";
import type { ChartAdapter } from "./types";

type Props = {
	data: uPlot.AlignedData;
	options: uPlot.Options;
	resetScales: boolean;
};

/**
 * Declarative mount, imperative hot path.
 *
 * WHY: High-frequency streaming should not pay for React commits.
 * After mount we call uPlot/session APIs directly; competitors that
 * re-render on every data tick will show higher React commit counts.
 */
export function createRuplotAdapter(onCommit: () => void): ChartAdapter {
	let root: Root | null = null;
	let props: Props | null = null;
	let instance: uPlot | null = null;
	const chartRef = createRef<ChartRef>();

	const render = () => {
		if (!root || !props) return;
		root.render(
			createElement(
				Profiler,
				{
					id: "ruplot",
					onRender: () => {
						onCommit();
					},
				},
				createElement(Chart, {
					ref: chartRef,
					data: props.data,
					options: props.options,
					resetScales: props.resetScales,
					onReady: (chart) => {
						instance = chart;
					},
				}),
			),
		);
	};

	return {
		id: "ruplot",
		mount({ host, options, data }) {
			root?.unmount();
			host.replaceChildren();
			root = createRoot(host);
			props = { data, options, resetScales: true };
			render();
			return () => {
				root?.unmount();
				root = null;
				props = null;
				instance = null;
				host.replaceChildren();
			};
		},
		updateData(data, resetScales = true) {
			if (!props) return;
			props = { ...props, data, resetScales };
			const chart = instance ?? chartRef.current?.getInstance() ?? null;
			if (chart) {
				chart.setData(data, resetScales);
				if (resetScales === false) chart.redraw();
				instance = chart;
				return;
			}
			render();
		},
		setSize(width, height) {
			if (!props) return;
			props = {
				...props,
				options: { ...props.options, width, height },
			};
			const chart = instance ?? chartRef.current?.getInstance() ?? null;
			if (chart) {
				chart.setSize({ width, height });
				instance = chart;
				return;
			}
			render();
		},
		setScale(key, min, max) {
			if (!props) return;
			props = {
				...props,
				options: {
					...props.options,
					scales: {
						...props.options.scales,
						[key]: {
							...(props.options.scales?.[key] ?? {}),
							min,
							max,
						},
					},
				},
			};
			const chart = instance ?? chartRef.current?.getInstance() ?? null;
			if (chart) {
				chart.setScale(key, { min, max });
				instance = chart;
				return;
			}
			render();
		},
		setCursor(left, top) {
			const chart = instance ?? chartRef.current?.getInstance() ?? null;
			chart?.setCursor({ left, top });
		},
		getInstance: () => instance ?? chartRef.current?.getInstance() ?? null,
	};
}
