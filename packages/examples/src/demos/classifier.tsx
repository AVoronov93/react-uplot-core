import { Chart } from "@ruplot/react";
import { useEffect, useMemo, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

/** Visibly different shapes so Toggle is obvious. */
const dataA = sineSeries(40, { amp: 8 });
const dataB = sineSeries(40, { amp: 18, noise: 2 });

const MODE_LABEL = {
	data: "Swap data arrays",
	stroke: "Change stroke color",
	size: "Change chart width",
	title: "Change title (structural)",
} as const;

const EXPECT = {
	data: "setData (same instance)",
	stroke: "patchSeries + redraw (same instance)",
	size: "setSize (same instance)",
	title: "recreate (+ restore runtime)",
} as const;

export type ClassifierDemoProps = {
	chrome?: boolean;
	initialMode?: keyof typeof MODE_LABEL;
};

export function ClassifierDemo({ chrome = true, initialMode = "data" }: ClassifierDemoProps) {
	const [mode, setMode] = useState<keyof typeof MODE_LABEL>(initialMode);
	const [flip, setFlip] = useState(false);
	const [log, setLog] = useState<string[]>([]);

	useEffect(() => {
		setMode(initialMode);
	}, [initialMode]);

	const data = flip ? dataB : dataA;

	const options = useMemo<uPlot.Options>(() => {
		return {
			width: mode === "size" && flip ? 520 : CHART_W,
			height: CHART_H,
			title: mode === "title" && flip ? "Variant B" : "Variant A",
			series: [
				{},
				{
					label: "Signal",
					stroke: mode === "stroke" && flip ? "#f97316" : "#0ea5e9",
					width: 2,
				},
			],
			scales: { x: { time: false } },
			legend: { show: false },
		};
	}, [mode, flip]);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note" style={{ marginBottom: 8 }}>
				<strong>What this is:</strong> the option classifier picks the cheapest uPlot API for each
				prop change. Pick a change type, then press Apply — watch the chart and the expected
				command.
			</p>
			<div className="tabs" style={{ marginBottom: 12 }}>
				{(Object.keys(MODE_LABEL) as (keyof typeof MODE_LABEL)[]).map((m) => (
					<button
						key={m}
						type="button"
						className={mode === m ? "tab active" : "tab"}
						onClick={() => setMode(m)}
						title={MODE_LABEL[m]}
					>
						{MODE_LABEL[m]}
					</button>
				))}
				<button
					type="button"
					className="tab"
					onClick={() => {
						setFlip((v) => !v);
						setLog((prev) => [`Apply → expect ${EXPECT[mode]}`, ...prev].slice(0, 6));
					}}
				>
					Apply change
				</button>
			</div>
			<p className="panel-note">
				Expect: <code>{EXPECT[mode]}</code>
				{mode === "data" && " — waveform swaps A↔B"}
				{mode === "stroke" && " — blue↔orange, instance kept"}
				{mode === "size" && " — width 720↔520"}
				{mode === "title" && " — new uPlot instance (title is structural)"}
			</p>
			<ul className="demo-pitfalls" style={{ marginBottom: 12 }}>
				{log.map((line) => (
					<li key={line}>{line}</li>
				))}
			</ul>
			<Chart data={data} options={options} />
		</DemoShell>
	);
}
