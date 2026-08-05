import { Chart, streamingWindow } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const CAPACITY = 80;

function seed(): uPlot.AlignedData {
	const x = Array.from({ length: CAPACITY }, (_, i) => i);
	const y = x.map((i) => Math.sin(i / 10) * 8 + 10);
	return [x, y];
}

export type StreamingWindowDemoProps = {
	chrome?: boolean;
	intervalMs?: number;
	stroke?: string;
};

/**
 * Shows the `streamingWindow()` helper: fixed-capacity ring buffer for prop-driven updates.
 * Deliberately slower than the 60Hz Streaming demo — this path goes through React setState.
 */
export function StreamingWindowDemo({
	chrome = true,
	intervalMs = 250,
	stroke = "#0ea5e9",
}: StreamingWindowDemoProps) {
	const [data, setData] = useState(seed);
	const tick = useRef(CAPACITY);
	const rangeEl = useRef<HTMLSpanElement>(null);
	const lenEl = useRef<HTMLSpanElement>(null);

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title: `Fixed window · ${CAPACITY} points`,
			series: [{}, { label: "Window", stroke, width: 2, points: { show: false } }],
			scales: { x: { time: false } },
			legend: { show: false },
			cursor: { show: false },
		}),
		[stroke],
	);

	useEffect(() => {
		const id = window.setInterval(() => {
			tick.current += 1;
			const t = tick.current;
			setData((prev) => {
				const next = streamingWindow({
					buffer: prev,
					chunk: [[t], [Math.sin(t / 10) * 8 + 10]],
					capacity: CAPACITY,
				});
				const x = next[0] as number[];
				if (rangeEl.current) {
					rangeEl.current.textContent = `${x[0]} → ${x[x.length - 1]}`;
				}
				if (lenEl.current) lenEl.current.textContent = String(x.length);
				return next;
			});
		}, intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);

	return (
		<DemoShell chrome={chrome}>
			<div className="stats" style={{ marginBottom: 8 }}>
				<div className="stat">
					<span className="stat-label">Capacity</span>
					<span className="stat-value">{CAPACITY}</span>
				</div>
				<div className="stat">
					<span className="stat-label">Length</span>
					<span className="stat-value" ref={lenEl}>
						{CAPACITY}
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">X window</span>
					<span className="stat-value small" ref={rangeEl}>
						0 → {CAPACITY - 1}
					</span>
				</div>
			</div>
			<p className="panel-note">
				<strong>What this is:</strong> <code>streamingWindow()</code> appends a chunk and drops the
				oldest samples so the array stays at capacity. Useful when you update via React{" "}
				<code>data</code> props (not the imperative 60Hz Streaming demo). Watch the X window slide;
				length stays {CAPACITY}.
			</p>
			<Chart data={data} options={options} streaming={{ enabled: true, follow: true }} />
		</DemoShell>
	);
}
