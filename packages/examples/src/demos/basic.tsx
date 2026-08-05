import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

export type BasicDemoProps = {
	chrome?: boolean;
	width?: number;
	height?: number;
	title?: string;
	stroke?: string;
	points?: number;
	lineWidth?: number;
};

export function BasicDemo({
	chrome = true,
	width = CHART_W,
	height = CHART_H,
	title = "Basic mount",
	stroke = "#0ea5e9",
	points = 40,
	lineWidth = 2,
}: BasicDemoProps) {
	const data = useMemo(() => sineSeries(points), [points]);
	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height,
			title,
			series: [{}, { label: "Signal", stroke, width: lineWidth }],
			scales: { x: { time: false } },
			legend: { show: false },
		}),
		[width, height, title, stroke, lineWidth],
	);

	return (
		<DemoShell chrome={chrome}>
			<Chart data={data} options={options} />
		</DemoShell>
	);
}
