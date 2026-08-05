import { Chart, holdForwardGaps, seriesStepped } from "@ruplot/react";
import { useEffect, useMemo, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sparseWithGaps } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const sparse = sparseWithGaps(48);

export type GapsSteppedDemoProps = {
	chrome?: boolean;
	holdForward?: boolean;
};

export function GapsSteppedDemo({ chrome = true, holdForward = true }: GapsSteppedDemoProps) {
	const [hold, setHold] = useState(holdForward);

	useEffect(() => {
		setHold(holdForward);
	}, [holdForward]);

	const data = useMemo<uPlot.AlignedData>(() => {
		if (!hold) return sparse;
		const y = holdForwardGaps(sparse[1] as ArrayLike<number | null>);
		return [sparse[0]!, y];
	}, [hold]);

	const options: uPlot.Options = {
		width: CHART_W,
		height: CHART_H,
		title: hold ? "Stepped + hold-forward gaps" : "Stepped + raw nulls",
		series: [{}, seriesStepped({ label: "Metric", stroke: "#0ea5e9", width: 2 })],
		scales: { x: { time: false } },
		legend: { show: false },
	};

	return (
		<DemoShell chrome={chrome}>
			<div className="tabs" style={{ marginBottom: 12 }}>
				<button type="button" className={hold ? "tab active" : "tab"} onClick={() => setHold(true)}>
					Hold-forward
				</button>
				<button
					type="button"
					className={!hold ? "tab active" : "tab"}
					onClick={() => setHold(false)}
				>
					Raw gaps
				</button>
			</div>
			<p className="panel-note">
				Industrial sparse feeds: <code>holdForwardGaps</code> + <code>seriesStepped</code>.
			</p>
			<Chart data={data} options={options} />
		</DemoShell>
	);
}
