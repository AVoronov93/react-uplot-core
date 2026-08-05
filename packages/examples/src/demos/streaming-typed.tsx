import { Chart, streamingWindow } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";
const CAPACITY = 200;
const seed = (): uPlot.AlignedData => {
	const x = Float64Array.from({ length: CAPACITY }, (_, i) => i);
	return [x, Float64Array.from(x, (i) => Math.sin(i / 10) * 8 + 10)];
};
export function StreamingTypedDemo({ chrome = true }: { chrome?: boolean }) {
	const [data, setData] = useState(seed);
	const tick = useRef(CAPACITY);
	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#0ea5e9", width: 2 }],
		}),
		[],
	);
	useEffect(() => {
		const id = setInterval(() => {
			const t = ++tick.current;
			setData((prev) =>
				streamingWindow({
					buffer: prev,
					chunk: [Float64Array.of(t), Float64Array.of(Math.sin(t / 10) * 8 + 10)],
					capacity: CAPACITY,
					typed: true,
				}),
			);
		}, 250);
		return () => clearInterval(id);
	}, []);
	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				<strong>Typed window:</strong> capacity {CAPACITY}; <code>typed: true</code> preserves typed
				columns for streaming-friendly data pipelines.
			</p>
			<div className="stats">
				<div className="stat">
					<span className="stat-label">Column constructors</span>
					<span className="stat-value small">
						{data.map((column) => column.constructor.name).join(", ")}
					</span>
				</div>
			</div>
			<Chart data={data} options={options} streaming={{ enabled: true, follow: true }} />
		</DemoShell>
	);
}
