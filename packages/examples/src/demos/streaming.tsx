import { Chart, type ChartRef } from "@ruplot/react";
import { Profiler, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const POINTS = 400;
const HZ = 60;

function makeBuffer(): uPlot.AlignedData {
	const x = new Float64Array(POINTS);
	const y = new Float64Array(POINTS);
	for (let i = 0; i < POINTS; i++) {
		x[i] = i;
		y[i] = Math.sin(i / 18) * 12 + Math.sin(i / 7) * 3;
	}
	return [x, y];
}

function advance(data: uPlot.AlignedData, tick: number): void {
	const x = data[0] as Float64Array;
	const y = data[1] as Float64Array;
	const last = POINTS - 1;
	x.copyWithin(0, 1);
	y.copyWithin(0, 1);
	x[last] = x[last - 1]! + 1;
	y[last] = Math.sin((tick + POINTS) / 18) * 12 + Math.sin((tick + POINTS) / 7) * 3;
}

const options: uPlot.Options = {
	width: CHART_W,
	height: CHART_H,
	title: "Streaming 60Hz",
	series: [{}, { label: "Live", stroke: "#0ea5e9", width: 2 }],
	scales: { x: { time: false } },
	legend: { show: false },
	cursor: { show: false },
};

function CommitProbe({ children, onCommit }: { children: ReactNode; onCommit: () => void }) {
	return (
		<Profiler id="streaming-chart" onRender={() => onCommit()}>
			{children}
		</Profiler>
	);
}

export type StreamingDemoProps = {
	chrome?: boolean;
	/** Start the rAF ingest loop. */
	autoStart?: boolean;
};

export function StreamingDemo({ chrome = true, autoStart = true }: StreamingDemoProps) {
	const chartRef = useRef<ChartRef>(null);
	const dataRef = useRef(makeBuffer());
	const tickRef = useRef(0);
	const rafRef = useRef(0);
	const commitsRef = useRef(0);
	const framesRef = useRef(0);
	const lastFpsAt = useRef(performance.now());

	const fpsEl = useRef<HTMLSpanElement>(null);
	const commitsEl = useRef<HTMLSpanElement>(null);
	const pointsEl = useRef<HTMLSpanElement>(null);
	const ingestedEl = useRef<HTMLSpanElement>(null);

	const [running, setRunning] = useState(autoStart);

	useLayoutEffect(() => {
		setRunning(autoStart);
	}, [autoStart]);

	useLayoutEffect(() => {
		if (!running) return;

		const loop = (now: number) => {
			tickRef.current += 1;
			advance(dataRef.current, tickRef.current);
			const chart = chartRef.current?.getInstance();
			if (chart) {
				const x = dataRef.current[0] as Float64Array;
				chart.setData(dataRef.current, false);
				chart.setScale("x", { min: x[0]!, max: x[x.length - 1]! });
			}

			if (pointsEl.current) pointsEl.current.textContent = String(POINTS);
			if (ingestedEl.current) {
				ingestedEl.current.textContent = String(POINTS + tickRef.current);
			}

			framesRef.current += 1;
			const elapsed = now - lastFpsAt.current;
			if (elapsed >= 500) {
				const fps = (framesRef.current / elapsed) * 1000;
				if (fpsEl.current) fpsEl.current.textContent = fps.toFixed(0);
				if (commitsEl.current) commitsEl.current.textContent = String(commitsRef.current);
				framesRef.current = 0;
				lastFpsAt.current = now;
			}

			rafRef.current = requestAnimationFrame(loop);
		};

		rafRef.current = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(rafRef.current);
	}, [running]);

	return (
		<DemoShell chrome={chrome}>
			<div data-testid="streaming-panel">
				<div className="stats" aria-live="polite">
					<div className="stat">
						<span className="stat-label">FPS</span>
						<span className="stat-value" ref={fpsEl} data-testid="fps">
							—
						</span>
					</div>
					<div className="stat">
						<span className="stat-label">Points</span>
						<span className="stat-value" ref={pointsEl} data-testid="points">
							{POINTS}
						</span>
					</div>
					<div className="stat">
						<span className="stat-label">Ingested</span>
						<span className="stat-value" ref={ingestedEl} data-testid="ingested">
							{POINTS}
						</span>
					</div>
					<div className="stat">
						<span className="stat-label">UI re-renders</span>
						<span className="stat-value accent" ref={commitsEl} data-testid="commits">
							0
						</span>
					</div>
					<button type="button" className="tab" onClick={() => setRunning((v) => !v)}>
						{running ? "Pause" : "Resume"}
					</button>
				</div>
				<p className="panel-note">
					{POINTS} point window @ {HZ}Hz via imperative <code>setData</code> — React stays quiet.
				</p>
				<CommitProbe
					onCommit={() => {
						commitsRef.current += 1;
						if (commitsEl.current) commitsEl.current.textContent = String(commitsRef.current);
					}}
				>
					<Chart
						ref={chartRef}
						data={dataRef.current}
						options={options}
						streaming={{ enabled: true, follow: true, resetScales: false }}
					/>
				</CommitProbe>
			</div>
		</DemoShell>
	);
}
