import { Chart, type ChartRef } from "@ruplot/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_W } from "../shared/data.js";
import { generateLargeData, readPointCount } from "../shared/large-data.js";
import { DemoShell } from "./DemoShell.js";
import { DragResizeFrame } from "./DragResizeFrame.js";

export type LargeResizeDemoProps = {
	chrome?: boolean;
	defaultPoints?: number;
	initialWidth?: number;
	initialHeight?: number;
	/** Start the setScale pan so FPS is measurable immediately. */
	autoPan?: boolean;
};

/**
 * Large typed arrays + drag-resize setSize + optional dynamic zoom — watch FPS dip while dragging.
 */
export function LargeResizeDemo({
	chrome = true,
	defaultPoints = 500_000,
	initialWidth = CHART_W,
	initialHeight = 300,
	autoPan = true,
}: LargeResizeDemoProps) {
	const chartRef = useRef<ChartRef>(null);
	const dataRef = useRef<uPlot.AlignedData | null>(null);
	const loopRaf = useRef(0);
	const framesRef = useRef(0);
	const lastFpsAt = useRef(performance.now());

	const pointsTarget = useMemo(() => readPointCount(defaultPoints), [defaultPoints]);

	const [ready, setReady] = useState(false);
	const [generated, setGenerated] = useState(0);
	const [width, setWidth] = useState(initialWidth);
	const [height, setHeight] = useState(initialHeight);
	const [panning, setPanning] = useState(autoPan);
	const [dragging, setDragging] = useState(false);

	const fpsEl = useRef<HTMLSpanElement>(null);
	const sizeEl = useRef<HTMLSpanElement>(null);
	const windowEl = useRef<HTMLSpanElement>(null);
	const pointsEl = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		setWidth(initialWidth);
		setHeight(initialHeight);
	}, [initialWidth, initialHeight]);

	useEffect(() => {
		setPanning(autoPan);
	}, [autoPan]);

	useEffect(() => {
		let cancelled = false;
		setReady(false);
		setGenerated(0);
		(async () => {
			const data = await generateLargeData(pointsTarget, (done) => {
				if (!cancelled) setGenerated(done);
			});
			if (cancelled) return;
			dataRef.current = data;
			setReady(true);
			if (pointsEl.current) pointsEl.current.textContent = pointsTarget.toLocaleString("en-US");
		})();
		return () => {
			cancelled = true;
		};
	}, [pointsTarget]);

	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height,
			title: `Large + drag-resize · ${pointsTarget.toLocaleString("en-US")} pts`,
			series: [{}, { label: "Signal", stroke: "#0ea5e9", width: 1, points: { show: false } }],
			scales: { x: { time: false } },
			legend: { show: false },
			cursor: { drag: { x: true, y: false } },
		}),
		[width, height, pointsTarget],
	);

	useEffect(() => {
		if (sizeEl.current) sizeEl.current.textContent = `${width}×${height}`;
	}, [width, height]);

	useLayoutEffect(() => {
		if (!ready || (!panning && !dragging)) return;
		const data = dataRef.current;
		const x = data?.[0] as Float64Array | undefined;
		const n = x?.length ?? 0;
		const windowSize = n > 0 ? Math.max(20_000, Math.floor(n * 0.08)) : 0;
		const maxStart = Math.max(0, n - windowSize);
		let pos = 0;
		let dir = 1;
		const speed = 0.0015;

		const loop = (now: number) => {
			framesRef.current += 1;
			const elapsed = now - lastFpsAt.current;
			if (elapsed >= 250) {
				if (fpsEl.current) {
					fpsEl.current.textContent = ((framesRef.current / elapsed) * 1000).toFixed(0);
				}
				framesRef.current = 0;
				lastFpsAt.current = now;
			}

			if (panning && x) {
				const chart = chartRef.current?.getInstance();
				if (chart) {
					pos += speed * dir;
					if (pos >= 1) {
						pos = 1;
						dir = -1;
					} else if (pos <= 0) {
						pos = 0;
						dir = 1;
					}
					const start = Math.floor(pos * maxStart);
					const min = x[start]!;
					const max = x[Math.min(n - 1, start + windowSize - 1)]!;
					chart.setScale("x", { min, max });
					if (windowEl.current) {
						windowEl.current.textContent = `${Math.round(min).toLocaleString("en-US")}–${Math.round(max).toLocaleString("en-US")}`;
					}
				}
			}

			loopRaf.current = requestAnimationFrame(loop);
		};
		loopRaf.current = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(loopRaf.current);
	}, [ready, panning, dragging]);

	const progress = pointsTarget === 0 ? 0 : Math.round((generated / pointsTarget) * 100);
	const data = dataRef.current;

	return (
		<DemoShell chrome={chrome}>
			<div className="stats">
				<div className="stat">
					<span className="stat-label">FPS</span>
					<span className="stat-value accent" ref={fpsEl}>
						—
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">Points</span>
					<span className="stat-value" ref={pointsEl}>
						{ready ? pointsTarget.toLocaleString("en-US") : "…"}
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">Size</span>
					<span className="stat-value small" ref={sizeEl}>
						{width}×{height}
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">X window</span>
					<span className="stat-value small" ref={windowEl}>
						—
					</span>
				</div>
			</div>
			{!ready ? (
				<p className="panel-note">Generating… {progress}%</p>
			) : (
				<p className="panel-note">
					Drag the <strong>↘ corner</strong> for continuous <code>setSize</code> — FPS updates while
					dragging (and while pan is on). Zoom window should survive the resize.
				</p>
			)}
			<div className="tabs" style={{ marginBottom: 12 }}>
				<button
					type="button"
					className={panning ? "tab active" : "tab"}
					disabled={!ready}
					onClick={() => setPanning((v) => !v)}
				>
					{panning ? "Pause pan" : "Pan zoom"}
				</button>
				<button
					type="button"
					className="tab"
					disabled={!ready}
					onClick={() => {
						setWidth(CHART_W);
						setHeight(300);
					}}
				>
					Reset size
				</button>
			</div>
			{ready && data ? (
				<DragResizeFrame
					width={width}
					height={height}
					onDragChange={setDragging}
					onSize={({ width: w, height: h }) => {
						setWidth(w);
						setHeight(h);
						if (sizeEl.current) sizeEl.current.textContent = `${w}×${h}`;
						chartRef.current?.getInstance()?.setSize({ width: w, height: h });
					}}
				>
					<Chart ref={chartRef} data={data} options={options} />
				</DragResizeFrame>
			) : (
				<div className="skeleton" />
			)}
		</DemoShell>
	);
}
