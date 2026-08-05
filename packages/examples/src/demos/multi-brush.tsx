import { Chart, type TimeRange } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";
import { CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(300);

/**
 * One X overview drives two detail charts. Detail B adds a Y window (one brush per chart).
 */
export function MultiBrushDemo({ chrome = true }: { chrome?: boolean }) {
	const [xRange, setXRange] = useState<TimeRange>({ min: 60, max: 160 });
	const [yRange, setYRange] = useState<TimeRange>({ min: 14, max: 28 });

	const overviewX = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 90,
			title: "X overview — drag band / grips",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#64748b", width: 1 }],
			cursor: { drag: { setScale: false, x: false, y: false } },
		}),
		[],
	);

	const detailA = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 150,
			title: "Detail A — follows shared X",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#0ea5e9", width: 2 }],
		}),
		[],
	);

	const detailB = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 150,
			title: "Detail B — shared X + Y zoom",
			scales: {
				x: { time: false, min: xRange.min, max: xRange.max },
				y: { time: false },
			},
			legend: { show: false },
			series: [{}, { stroke: "#a855f7", width: 2 }],
		}),
		[xRange.min, xRange.max],
	);

	const overviewY = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 120,
			title: "Y overview for Detail B",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#a855f7", width: 1 }],
			cursor: { drag: { setScale: false, x: false, y: false } },
		}),
		[],
	);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				<strong>Multi-brush:</strong> overview X sets the shared window (both details follow).
				Detail B uses a <em>separate</em> Y brush — only one brush component per chart.
			</p>
			<Chart data={data} options={overviewX}>
				<Chart.Brush
					value={xRange}
					onChange={setXRange}
					bindScale={false}
					grips
					panBand
					showSelect={false}
				/>
			</Chart>
			<div style={{ height: 12 }} />
			<Chart.SyncGroup id="multi-brush-demo">
				<Chart data={data} options={detailA}>
					<Chart.Brush value={xRange} onChange={setXRange} />
				</Chart>
				<div style={{ height: 8 }} />
				<Chart data={data} options={detailB}>
					<Chart.Brush value={yRange} onChange={setYRange} scaleKey="y" />
				</Chart>
			</Chart.SyncGroup>
			<div style={{ height: 12 }} />
			<Chart data={data} options={overviewY}>
				<Chart.Brush
					value={yRange}
					onChange={setYRange}
					orientation="y"
					scaleKey="y"
					bindScale={false}
					grips
					panBand
					showSelect={false}
				/>
			</Chart>
		</DemoShell>
	);
}
