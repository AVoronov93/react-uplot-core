import { Chart, seriesStepped } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(80);

export type SyncDemoProps = {
	chrome?: boolean;
	strokeA?: string;
	strokeB?: string;
};

export function SyncDemo({
	chrome = true,
	strokeA = "#0ea5e9",
	strokeB = "#f97316",
}: SyncDemoProps) {
	const topOptions = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 160,
			title: "Synced A",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, seriesStepped({ label: "Stepped", stroke: strokeA, width: 2 })],
			cursor: { drag: { x: true, y: false } },
		}),
		[strokeA],
	);

	const bottomOptions = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 160,
			title: "Synced B",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { label: "Linear", stroke: strokeB, width: 2 }],
			cursor: { drag: { x: true, y: false } },
		}),
		[strokeB],
	);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">Hover either plot — cursor sync via SyncGroup registry.</p>
			<Chart.SyncGroup id="demo-sync">
				<Chart data={data} options={topOptions} />
				<div style={{ height: 12 }} />
				<Chart data={data} options={bottomOptions} />
			</Chart.SyncGroup>
		</DemoShell>
	);
}
