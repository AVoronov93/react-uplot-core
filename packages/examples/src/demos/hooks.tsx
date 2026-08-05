import { Chart, useCursor, useScales } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

function Hud() {
	const idx = useCursor((c) => c.idx);
	const x = useScales((s) => s.x);
	return (
		<div className="stats" style={{ marginBottom: 12 }}>
			<div className="stat">
				<span className="stat-label">Cursor idx</span>
				<span className="stat-value accent">{idx ?? "—"}</span>
			</div>
			<div className="stat">
				<span className="stat-label">x min</span>
				<span className="stat-value small">{x?.min == null ? "—" : x.min.toFixed(1)}</span>
			</div>
			<div className="stat">
				<span className="stat-label">x max</span>
				<span className="stat-value small">{x?.max == null ? "—" : x.max.toFixed(1)}</span>
			</div>
		</div>
	);
}

export type HooksDemoProps = {
	chrome?: boolean;
	width?: number;
	height?: number;
	stroke?: string;
	points?: number;
};

export function HooksDemo({
	chrome = true,
	width = CHART_W,
	height = CHART_H,
	stroke = "#0ea5e9",
	points = 60,
}: HooksDemoProps) {
	const data = useMemo(() => sineSeries(points), [points]);
	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height,
			title: "Hooks (external stores)",
			series: [{}, { label: "Signal", stroke, width: 2 }],
			scales: { x: { time: false } },
			legend: { show: false },
		}),
		[width, height, stroke],
	);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				Hover the chart — HUD updates via <code>useSyncExternalStore</code>. The chart canvas does
				not re-render on every cursor move.
			</p>
			<Chart data={data} options={options}>
				<Hud />
			</Chart>
		</DemoShell>
	);
}
