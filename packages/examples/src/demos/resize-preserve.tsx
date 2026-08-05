import { Chart, type ChartRef, type TimeRange } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(100);
const xCol = data[0] as number[];
const FULL: TimeRange = { min: xCol[0]!, max: xCol[xCol.length - 1]! };

export type ResizePreserveDemoProps = {
	chrome?: boolean;
	initialWidth?: number;
	zoomMin?: number;
	zoomMax?: number;
};

export function ResizePreserveDemo({
	chrome = true,
	initialWidth = CHART_W,
	zoomMin = 20,
	zoomMax = 60,
}: ResizePreserveDemoProps) {
	const chartRef = useRef<ChartRef>(null);
	const [width, setWidth] = useState(initialWidth);
	const band: TimeRange = useMemo(() => ({ min: zoomMin, max: zoomMax }), [zoomMin, zoomMax]);
	const [range, setRange] = useState<TimeRange>(band);

	useEffect(() => {
		setWidth(initialWidth);
	}, [initialWidth]);

	useEffect(() => {
		setRange(band);
	}, [band]);

	const isBand = Math.abs(range.min - band.min) < 1e-9 && Math.abs(range.max - band.max) < 1e-9;

	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height: CHART_H,
			title: `Width ${width}px · x ${range.min.toFixed(0)}–${range.max.toFixed(0)}`,
			series: [{}, { label: "Signal", stroke: "#0ea5e9", width: 2 }],
			scales: {
				x: { time: false, min: range.min, max: range.max },
			},
			legend: { show: false },
			cursor: { drag: { x: true, y: false } },
		}),
		[width, range],
	);

	const zoomToBand = () => {
		setRange(band);
		chartRef.current?.getInstance()?.setScale("x", { min: band.min, max: band.max });
	};

	const zoomToFull = () => {
		setRange(FULL);
		chartRef.current?.getInstance()?.setScale("x", { min: FULL.min, max: FULL.max });
	};

	return (
		<DemoShell chrome={chrome}>
			<div className="tabs" style={{ marginBottom: 12 }}>
				<button type="button" className="tab" onClick={() => setWidth(480)}>
					Narrow
				</button>
				<button type="button" className="tab" onClick={() => setWidth(CHART_W)}>
					Normal
				</button>
				<button type="button" className="tab" onClick={() => setWidth(900)}>
					Wide
				</button>
				<button type="button" className={isBand ? "tab active" : "tab"} onClick={zoomToBand}>
					Zoom x={zoomMin}–{zoomMax}
				</button>
				<button type="button" className={!isBand ? "tab active" : "tab"} onClick={zoomToFull}>
					Full X range
				</button>
			</div>
			<p className="panel-note">
				<strong>Try this:</strong> press{" "}
				<em>
					Zoom x={zoomMin}–{zoomMax}
				</em>{" "}
				(chart crops to that band), then <em>Wide</em> / <em>Narrow</em> — the band stays because
				width is <code>setSize</code>, not a full recreate. <em>Full X range</em> resets to 0–
				{FULL.max}. Drag on the plot also zooms; buttons always set an explicit min/max (uPlot
				cannot “clear” scales by omitting them).
			</p>
			<Chart ref={chartRef} data={data} options={options}>
				<Chart.Brush value={range} onChange={setRange} />
			</Chart>
		</DemoShell>
	);
}
