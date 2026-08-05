import { Chart, type TimeRange } from "@ruplot/react";
import { useEffect, useMemo, useState } from "react";
import type uPlot from "uplot";
import { CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(300);

const overviewOptions: uPlot.Options = {
	width: CHART_W,
	height: 100,
	scales: { x: { time: false } },
	legend: { show: false },
	series: [{}, { stroke: "#64748b", width: 1 }],
	cursor: { drag: { setScale: false, x: false, y: false } },
};

export type BrushPanYDemoProps = {
	chrome?: boolean;
	xMin?: number;
	xMax?: number;
	yMin?: number;
	yMax?: number;
};

/**
 * Two patterns:
 * 1) X overview: bindScale={false} + grips + panBand (detail chart binds X).
 * 2) Y selector: bindScale={false} on full-range chart; detail chart binds Y.
 */
export function BrushPanYDemo({
	chrome = true,
	xMin = 80,
	xMax = 180,
	yMin = 14,
	yMax = 28,
}: BrushPanYDemoProps) {
	const [xRange, setXRange] = useState<TimeRange>({ min: xMin, max: xMax });
	const [yRange, setYRange] = useState<TimeRange>({ min: yMin, max: yMax });

	useEffect(() => {
		setXRange({ min: xMin, max: xMax });
	}, [xMin, xMax]);

	useEffect(() => {
		setYRange({ min: yMin, max: yMax });
	}, [yMin, yMax]);

	const detailX = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 180,
			title: "Detail (X brush)",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#0ea5e9", width: 2 }],
		}),
		[],
	);

	const detailY = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 180,
			title: "Detail (Y brush)",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#a855f7", width: 2 }],
		}),
		[],
	);

	const yOverview = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 210,
			title: "Y frame selector — drag grips / pan the band",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#a855f7", width: 2 }],
			cursor: { drag: { setScale: false, x: false, y: false } },
		}),
		[],
	);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				<strong>Pan X:</strong> drag the overview band interior to move the window without resizing
				it. Grips still resize.
			</p>
			<Chart data={data} options={detailX}>
				<Chart.Brush value={xRange} onChange={setXRange} />
			</Chart>
			<div style={{ height: 10 }} />
			<Chart data={data} options={overviewOptions}>
				<Chart.Brush
					value={xRange}
					onChange={setXRange}
					bindScale={false}
					grips
					panBand
					showSelect={false}
				/>
			</Chart>

			<div style={{ height: 28 }} />
			<p className="panel-note">
				<strong>Y brush:</strong> overview keeps the full Y range with{" "}
				<code>bindScale={false}</code>. Detail applies the selected Y window — same idea as the X
				frame selector.
			</p>
			<Chart data={data} options={detailY}>
				<Chart.Brush value={yRange} onChange={setYRange} scaleKey="y" />
			</Chart>
			<div style={{ height: 10 }} />
			<Chart data={data} options={yOverview}>
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
