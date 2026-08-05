import { Chart, streamingWindow } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";
const CAPACITY = 100;
const seed = (): uPlot.AlignedData => {
	const x = Array.from({ length: CAPACITY }, (_, i) => i);
	return [x, x.map((i) => Math.sin(i / 9) * 8 + 10)];
};
export function StreamPolicyDemo({ chrome = true }: { chrome?: boolean }) {
	const [data, setData] = useState(seed);
	const [follow, setFollow] = useState(true);
	const tick = useRef(CAPACITY);
	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { label: "Live", stroke: "#0ea5e9", width: 2 }],
		}),
		[],
	);
	useEffect(() => {
		const id = window.setInterval(() => {
			const t = ++tick.current;
			setData((prev) =>
				streamingWindow({
					buffer: prev,
					chunk: [[t], [Math.sin(t / 9) * 8 + 10]],
					capacity: CAPACITY,
				}),
			);
		}, 250);
		return () => clearInterval(id);
	}, []);
	return (
		<DemoShell chrome={chrome}>
			<div className="stats">
				<div className="stat">
					<span className="stat-label">Data helper</span>
					<span className="stat-value small">streamingWindow</span>
				</div>
				<div className="stat">
					<span className="stat-label">Chart policy</span>
					<span className="stat-value small">streaming enabled</span>
				</div>
				<button type="button" className="tab" onClick={() => setFollow((v) => !v)}>
					Follow: {follow ? "on" : "off"}
				</button>
			</div>
			<p className="panel-note">
				The helper owns fixed-capacity data; <code>streaming</code> owns view policy. Toggle follow
				to retain the current viewport.
			</p>
			<Chart data={data} options={options} streaming={{ enabled: true, follow }} />
		</DemoShell>
	);
}
