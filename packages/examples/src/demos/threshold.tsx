import { Chart, thresholdPlugin } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(60, { amp: 12 });

export type ThresholdDemoProps = {
	chrome?: boolean;
	y?: number;
	thresholdStroke?: string;
	seriesStroke?: string;
};

export function ThresholdDemo({
	chrome = true,
	y = 25,
	thresholdStroke = "#f97316",
	seriesStroke = "#0ea5e9",
}: ThresholdDemoProps) {
	const plugins = useMemo(
		() => [thresholdPlugin({ y, stroke: thresholdStroke, dash: [6, 4] })],
		[y, thresholdStroke],
	);

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title: "thresholdPlugin",
			series: [{}, { label: "Metric", stroke: seriesStroke, width: 2 }],
			scales: { x: { time: false } },
			legend: { show: false },
		}),
		[seriesStroke],
	);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				Horizontal threshold in the uPlot paint cycle — keep <code>plugins</code> stable when
				possible; Storybook remounts when controls change.
			</p>
			<Chart data={data} options={options} plugins={plugins} />
		</DemoShell>
	);
}
