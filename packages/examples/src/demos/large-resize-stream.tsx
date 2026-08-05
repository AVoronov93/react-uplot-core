import { Chart, type ChartRef } from "@ruplot/react";
import { Profiler, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_W } from "../shared/data.js";
import { advanceStreamBuffer, makeStreamBuffer, readPointCount } from "../shared/large-data.js";
import { DemoShell } from "./DemoShell.js";
import { DragResizeFrame } from "./DragResizeFrame.js";

export type LargeResizeStreamDemoProps = {
	chrome?: boolean;
	defaultPoints?: number;
	initialWidth?: number;
	initialHeight?: number;
	hz?: number;
	autoStart?: boolean;
};

function CommitProbe({ children, onCommit }: { children: ReactNode; onCommit: () => void }) {
	return (
		<Profiler id="large-resize-stream" onRender={() => onCommit()}>
			{children}
		</Profiler>
	);
}

/**
 * Large sliding window @ Hz + drag-resize setSize while streaming — FPS + React commits.
 */
export function LargeResizeStreamDemo({
	chrome = true,
	defaultPoints = 200_000,
	initialWidth = CHART_W,
	initialHeight = 300,
	hz = 60,
	autoStart = true,
}: LargeResizeStreamDemoProps) {
	const capacity = useMemo(() => readPointCount(defaultPoints), [defaultPoints]);
	const chartRef = useRef<ChartRef>(null);
	const dataRef = useRef(makeStreamBuffer(capacity));
	const tickRef = useRef(0);
	const commitsRef = useRef(0);
	const framesRef = useRef(0);
	const lastFpsAt = useRef(performance.now());

	const fpsEl = useRef<HTMLSpanElement>(null);
	const commitsEl = useRef<HTMLSpanElement>(null);
	const windowEl = useRef<HTMLSpanElement>(null);
	const ingestedEl = useRef<HTMLSpanElement>(null);
	const sizeEl = useRef<HTMLSpanElement>(null);

	const [width, setWidth] = useState(initialWidth);
	const [height, setHeight] = useState(initialHeight);
	const [running, setRunning] = useState(autoStart);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setWidth(initialWidth);
		setHeight(initialHeight);
	}, [initialWidth, initialHeight]);

	useEffect(() => {
		setRunning(autoStart);
	}, [autoStart]);

	useEffect(() => {
		dataRef.current = makeStreamBuffer(capacity);
		tickRef.current = 0;
		setReady(true);
	}, [capacity]);

	useEffect(() => {
		if (sizeEl.current) sizeEl.current.textContent = `${width}×${height}`;
	}, [width, height]);

	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height,
			title: `Large stream · ${capacity.toLocaleString("en-US")} · ${hz}Hz`,
			series: [{}, { label: "Live", stroke: "#0ea5e9", width: 1, points: { show: false } }],
			scales: { x: { time: false } },
			legend: { show: false },
			cursor: { show: false },
		}),
		[width, height, capacity, hz],
	);

	useLayoutEffect(() => {
		if (!running || !ready) return;
		let raf = 0;
		let last = performance.now();
		const interval = 1000 / hz;

		const loop = (now: number) => {
			framesRef.current += 1;
			const fpsElapsed = now - lastFpsAt.current;
			if (fpsElapsed >= 250) {
				if (fpsEl.current) {
					fpsEl.current.textContent = ((framesRef.current / fpsElapsed) * 1000).toFixed(0);
				}
				if (commitsEl.current) commitsEl.current.textContent = String(commitsRef.current);
				framesRef.current = 0;
				lastFpsAt.current = now;
			}

			if (now - last >= interval) {
				last = now;
				tickRef.current += 1;
				advanceStreamBuffer(dataRef.current, tickRef.current);
				const chart = chartRef.current?.getInstance();
				if (chart) {
					const x = dataRef.current[0] as Float64Array;
					chart.setData(dataRef.current, false);
					chart.setScale("x", { min: x[0]!, max: x[x.length - 1]! });
					if (windowEl.current) {
						windowEl.current.textContent = `${Math.round(x[0]!).toLocaleString("en-US")}–${Math.round(x[x.length - 1]!).toLocaleString("en-US")}`;
					}
				}
				if (ingestedEl.current) {
					ingestedEl.current.textContent = String(capacity + tickRef.current);
				}
			}

			raf = requestAnimationFrame(loop);
		};

		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [running, ready, hz, capacity]);

	return (
		<DemoShell chrome={chrome}>
			<div className="stats" aria-live="polite">
				<div className="stat">
					<span className="stat-label">FPS</span>
					<span className="stat-value accent" ref={fpsEl}>
						—
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">Window</span>
					<span className="stat-value">{capacity.toLocaleString("en-US")}</span>
				</div>
				<div className="stat">
					<span className="stat-label">Ingested</span>
					<span className="stat-value" ref={ingestedEl}>
						{capacity}
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">UI re-renders</span>
					<span className="stat-value" ref={commitsEl}>
						0
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">Size</span>
					<span className="stat-value small" ref={sizeEl}>
						{width}×{height}
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">X</span>
					<span className="stat-value small" ref={windowEl}>
						—
					</span>
				</div>
			</div>
			<p className="panel-note">
				Stream @ {hz}Hz on a {capacity.toLocaleString("en-US")}-point window. Drag the{" "}
				<strong>↘ corner</strong> while streaming — FPS shows the cost of continuous{" "}
				<code>setSize</code>; React commits should stay near zero.
			</p>
			<div className="tabs" style={{ marginBottom: 12 }}>
				<button type="button" className="tab" onClick={() => setRunning((v) => !v)}>
					{running ? "Pause stream" : "Resume stream"}
				</button>
				<button
					type="button"
					className="tab"
					onClick={() => {
						setWidth(CHART_W);
						setHeight(300);
					}}
				>
					Reset size
				</button>
			</div>
			{ready ? (
				<CommitProbe
					onCommit={() => {
						commitsRef.current += 1;
						if (commitsEl.current) commitsEl.current.textContent = String(commitsRef.current);
					}}
				>
					<DragResizeFrame
						width={width}
						height={height}
						onSize={({ width: w, height: h }) => {
							setWidth(w);
							setHeight(h);
							if (sizeEl.current) sizeEl.current.textContent = `${w}×${h}`;
							chartRef.current?.getInstance()?.setSize({ width: w, height: h });
						}}
					>
						<Chart
							key={capacity}
							ref={chartRef}
							data={dataRef.current}
							options={options}
							streaming={{ enabled: true, follow: true, resetScales: false }}
						/>
					</DragResizeFrame>
				</CommitProbe>
			) : (
				<div className="skeleton" />
			)}
		</DemoShell>
	);
}
