import { Chart } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(180);
const COLORS = ["#0ea5e9", "#f97316", "#a855f7"];

export function SeriesVisualDemo({ chrome = true }: { chrome?: boolean }) {
	const [colorIndex, setColorIndex] = useState(0);
	const [ready, setReady] = useState(0);
	const stroke = COLORS[colorIndex]!;
	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { label: "Signal", stroke, width: 2 }],
		}),
		[stroke],
	);

	return <DemoShell chrome={chrome}>
		<div className="stats">
			<button type="button" className="tab" onClick={() => setColorIndex((i) => (i + 1) % COLORS.length)}>
				Change stroke
			</button>
			<div className="stat"><span className="stat-label">onReady mounts</span><span className="stat-value">{ready}</span></div>
		</div>
		<p className="panel-note"><strong>patchSeries + redraw:</strong> stroke used to recreate; now the instance stays alive — no flicker and <code>onReady</code> only once.</p>
		<Chart data={data} options={options} onReady={() => setReady((n) => n + 1)} />
	</DemoShell>;
}
