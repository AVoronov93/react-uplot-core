import { Profiler, createElement } from "react";
import { type Root, createRoot } from "react-dom/client";
import type uPlot from "uplot";
import UplotReact from "uplot-react";
import type { ChartAdapter } from "./types";

type Props = {
	data: uPlot.AlignedData;
	options: uPlot.Options;
	resetScales: boolean;
};

export function createUplotReactAdapter(onCommit: () => void): ChartAdapter {
	let root: Root | null = null;
	let props: Props | null = null;
	let instance: uPlot | null = null;

	const render = () => {
		if (!root || !props) return;
		root.render(
			createElement(
				Profiler,
				{
					id: "uplot-react",
					onRender: () => {
						onCommit();
					},
				},
				createElement(UplotReact, {
					data: props.data,
					options: props.options,
					resetScales: props.resetScales,
					onCreate: (chart: uPlot) => {
						instance = chart;
					},
				}),
			),
		);
	};

	return {
		id: "uplot-react",
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
			render();
		},
		setSize(width, height) {
			if (!props) return;
			props = {
				...props,
				options: { ...props.options, width, height },
			};
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
			render();
		},
		setCursor(left, top) {
			instance?.setCursor({ left, top });
		},
		getInstance: () => instance,
	};
}
