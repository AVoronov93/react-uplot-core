import { Chart, type ChartRef } from "@ruplot/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

export const LARGE_POINTS = 10_000_000;
const GEN_CHUNK = 250_000;

function readPointCount(fallback: number): number {
	const params = new URLSearchParams(window.location.search);
	const raw = params.get("points");
	if (!raw) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

async function generateLargeData(
	n: number,
	onProgress: (done: number) => void,
): Promise<uPlot.AlignedData> {
	const x = new Float64Array(n);
	const y = new Float64Array(n);

	for (let start = 0; start < n; start += GEN_CHUNK) {
		const end = Math.min(n, start + GEN_CHUNK);
		for (let i = start; i < end; i++) {
			x[i] = i;
			y[i] = Math.sin(i / 120_000) * 40 + Math.sin(i / 7_000) * 12 + (Math.random() - 0.5) * 6;
		}
		onProgress(end);
		await new Promise<void>((r) => setTimeout(r, 0));
	}

	return [x, y];
}

type Phase = "generating" | "static" | "dynamic";

export function LargeDataDemo({
	chrome = true,
	defaultPoints = LARGE_POINTS,
	initialPhase = "static",
}: {
	chrome?: boolean;
	defaultPoints?: number;
	/** After generate: show full overview or start dynamic setScale pan. */
	initialPhase?: "static" | "dynamic";
}) {
	const chartRef = useRef<ChartRef>(null);
	const dataRef = useRef<uPlot.AlignedData | null>(null);
	const zoomRaf = useRef(0);
	const commitsRef = useRef(0);
	const mountStartRef = useRef(0);

	const pointsTarget = useMemo(() => readPointCount(defaultPoints), [defaultPoints]);

	const [phase, setPhase] = useState<Phase>("generating");
	const [generated, setGenerated] = useState(0);
	const [mountMs, setMountMs] = useState<number | null>(null);
	const [ready, setReady] = useState(false);

	const pointsEl = useRef<HTMLSpanElement>(null);
	const mountEl = useRef<HTMLSpanElement>(null);
	const phaseEl = useRef<HTMLSpanElement>(null);
	const commitsEl = useRef<HTMLSpanElement>(null);
	const windowEl = useRef<HTMLSpanElement>(null);

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 300,
			title: `Large · ${(pointsTarget / 1e6).toFixed(pointsTarget >= 1e6 ? 0 : 2)}M`,
			series: [{}, { label: "Signal", stroke: "#0ea5e9", width: 1, points: { show: false } }],
			scales: { x: { time: false } },
			legend: { show: false },
		}),
		[pointsTarget],
	);

	useEffect(() => {
		let cancelled = false;
		setReady(false);
		setMountMs(null);
		setPhase("generating");
		(async () => {
			const data = await generateLargeData(pointsTarget, (done) => {
				if (!cancelled) setGenerated(done);
			});
			if (cancelled) return;
			dataRef.current = data;
			setGenerated(pointsTarget);
			setReady(true);
			if (pointsEl.current) pointsEl.current.textContent = pointsTarget.toLocaleString("en-US");
		})();
		return () => {
			cancelled = true;
		};
	}, [pointsTarget]);

	useEffect(() => {
		if (!ready) return;
		setPhase(initialPhase === "dynamic" ? "dynamic" : "static");
	}, [initialPhase, ready]);

	useLayoutEffect(() => {
		if (ready && mountMs == null) mountStartRef.current = performance.now();
	}, [ready, mountMs]);

	useEffect(() => {
		if (phase !== "dynamic" || !ready) return;
		const data = dataRef.current;
		if (!data) return;
		const x = data[0] as Float64Array;
		const n = x.length;
		const windowSize = Math.max(50_000, Math.floor(n * 0.08));
		const maxStart = Math.max(0, n - windowSize);
		let pos = 0;
		let dir = 1;
		const speed = 0.0012;

		const loop = () => {
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
			zoomRaf.current = requestAnimationFrame(loop);
		};
		zoomRaf.current = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(zoomRaf.current);
	}, [phase, ready]);

	const data = dataRef.current;
	const progress = pointsTarget === 0 ? 0 : Math.round((generated / pointsTarget) * 100);

	return (
		<DemoShell chrome={chrome}>
			<div className="stats" data-testid="large-panel" data-ready={ready ? "true" : "false"}>
				<div className="stat">
					<span className="stat-label">Points</span>
					<span className="stat-value" ref={pointsEl} data-testid="large-points">
						{ready ? pointsTarget.toLocaleString("en-US") : "…"}
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">Mount</span>
					<span className="stat-value" ref={mountEl} data-testid="large-mount">
						{mountMs == null ? "…" : `${mountMs.toFixed(0)}`}
					</span>
					<span className="stat-unit">ms</span>
				</div>
				<div className="stat">
					<span className="stat-label">Phase</span>
					<span className="stat-value" ref={phaseEl}>
						{phase}
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">UI re-renders</span>
					<span className="stat-value accent" ref={commitsEl}>
						0
					</span>
				</div>
			</div>
			{!ready ? (
				<p className="panel-note">Generating… {progress}%</p>
			) : (
				<p className="panel-note">
					Same typed arrays for static overview and dynamic <code>setScale</code> pan. Override via{" "}
					<code>?points=</code>.
				</p>
			)}
			<div className="tabs" style={{ marginBottom: 12 }}>
				<button
					type="button"
					className={phase === "static" ? "tab active" : "tab"}
					disabled={!ready}
					onClick={() => {
						setPhase("static");
						const series = dataRef.current?.[0] as Float64Array | undefined;
						const chart = chartRef.current?.getInstance();
						if (chart && series) {
							chart.setScale("x", { min: series[0]!, max: series[series.length - 1]! });
						}
					}}
				>
					Static
				</button>
				<button
					type="button"
					className={phase === "dynamic" ? "tab active" : "tab"}
					disabled={!ready}
					onClick={() => setPhase("dynamic")}
				>
					Dynamic zoom
				</button>
			</div>
			{ready && data ? (
				<Chart
					ref={chartRef}
					data={data}
					options={options}
					onReady={() => {
						commitsRef.current += 1;
						if (commitsEl.current) commitsEl.current.textContent = String(commitsRef.current);
						const elapsed = performance.now() - mountStartRef.current;
						setMountMs((prev) => {
							if (prev != null) return prev;
							if (mountEl.current) mountEl.current.textContent = elapsed.toFixed(0);
							return elapsed;
						});
					}}
				/>
			) : (
				<div className="skeleton" />
			)}
		</DemoShell>
	);
}
