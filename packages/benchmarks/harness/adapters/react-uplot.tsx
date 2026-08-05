import { Profiler, createElement } from "react";
import { type Root, createRoot } from "react-dom/client";
import { UPlot } from "react-uplot";
import type uPlot from "uplot";
import type { ChartAdapter } from "./types";

type Props = {
	data: uPlot.AlignedData;
	options: uPlot.Options;
};

/**
 * react-uplot recreates uPlot whenever data/options identity changes
 * (see its useEffect deps). That is intentional for a fair competitor matrix.
 */
export function createReactUplotAdapter(onCommit: () => void): ChartAdapter {
	let root: Root | null = null;
	let props: Props | null = null;
	const chartRef: { current: uPlot | null } = { current: null };

	const render = () => {
		if (!root || !props) return;
		root.render(
			createElement(
				Profiler,
				{
					id: "react-uplot",
					onRender: () => {
						onCommit();
					},
				},
				createElement(UPlot, {
					data: props.data,
					options: props.options,
					chartRef,
				}),
			),
		);
	};

	return {
		id: "react-uplot",
		mount({ host, options, data }) {
			root?.unmount();
			host.replaceChildren();
			root = createRoot(host);
			props = { data, options };
			render();
			return () => {
				root?.unmount();
				root = null;
				props = null;
				chartRef.current = null;
				host.replaceChildren();
			};
		},
		updateData(data) {
			if (!props) return;
			props = { ...props, data };
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
			chartRef.current?.setCursor({ left, top });
		},
		getInstance: () => chartRef.current,
	};
}
