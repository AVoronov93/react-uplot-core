import { Chart, createPlugin, type RuplotPlugin } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";
import type { RollingRequest, RollingResponse } from "./workers/rolling-stats.worker.js";

type Stats = { rms: number; min: number; max: number };

/**
 * Plugin that offloads series stats to a Worker and paints a dashed RMS guideline.
 * Host still owns setData — the plugin only reads `u.data` and draws.
 */
function createWorkerStatsPlugin(onStats: (s: Stats) => void): RuplotPlugin {
	let latest: RollingResponse | null = null;

	return createPlugin({
		key: "worker-rolling-stats",
		uplot: {
			hooks: {
				draw: [
					(u) => {
						if (!latest) return;
						const yPos = u.valToPos(latest.rms, "y", true);
						const { ctx } = u;
						ctx.save();
						ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
						ctx.setLineDash([6, 4]);
						ctx.lineWidth = 1.5;
						ctx.beginPath();
						ctx.moveTo(u.bbox.left, yPos);
						ctx.lineTo(u.bbox.left + u.bbox.width, yPos);
						ctx.stroke();
						ctx.restore();
					},
				],
			},
		},
		init({ u }) {
			const worker = new Worker(new URL("./workers/rolling-stats.worker.ts", import.meta.url), {
				type: "module",
			});
			let seq = 0;
			const badge = document.createElement("div");
			badge.style.cssText =
				"position:absolute;top:8px;left:8px;z-index:3;padding:4px 8px;background:#0f172a;color:#e2e8f0;font:11px ui-monospace,monospace;border-radius:4px;pointer-events:none;";
			badge.textContent = "worker…";
			u.root.style.position = "relative";
			u.root.appendChild(badge);

			worker.onmessage = (event: MessageEvent<RollingResponse>) => {
				latest = event.data;
				onStats({ rms: latest.rms, min: latest.min, max: latest.max });
				badge.textContent = `worker RMS ${latest.rms.toFixed(2)} · [${latest.min.toFixed(1)}, ${latest.max.toFixed(1)}]`;
				u.redraw(false, false);
			};

			const postY = () => {
				const col = u.data[1];
				if (!col) return;
				const y = Float64Array.from(col as ArrayLike<number>);
				const msg: RollingRequest = { id: ++seq, y };
				worker.postMessage(msg, [y.buffer]);
			};

			u.hooks.setData = u.hooks.setData ?? [];
			u.hooks.setData.push(postY);
			postY();

			return () => {
				worker.terminate();
				badge.remove();
				u.hooks.setData = (u.hooks.setData ?? []).filter((h) => h !== postY);
				latest = null;
			};
		},
	});
}

export type PluginWorkerDemoProps = {
	chrome?: boolean;
	noise?: number;
};

/**
 * Live series + plugin that computes RMS off-thread and draws a guideline.
 */
export function PluginWorkerDemo({ chrome = true, noise: noiseProp = 1.5 }: PluginWorkerDemoProps) {
	const [noise, setNoise] = useState(noiseProp);
	const [stats, setStats] = useState<Stats | null>(null);
	const [tick, setTick] = useState(0);
	const data = useMemo(() => sineSeries(200, { amp: 12, noise }), [noise, tick]);

	useEffect(() => {
		setNoise(noiseProp);
	}, [noiseProp]);

	const onStatsRef = useRef(setStats);
	onStatsRef.current = setStats;

	const plugins = useMemo(
		() => [createWorkerStatsPlugin((s) => onStatsRef.current(s))],
		[],
	);

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title: "Plugin + Worker (rolling RMS)",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { label: "Noisy signal", stroke: "#0ea5e9", width: 2 }],
		}),
		[],
	);

	return (
		<DemoShell chrome={chrome}>
			<div className="stats">
				<button type="button" className="tab" onClick={() => setTick((t) => t + 1)}>
					Resample noise
				</button>
				<button
					type="button"
					className="tab"
					onClick={() => setNoise((n) => (n < 3 ? n + 1 : 0.5))}
				>
					Noise {noise.toFixed(1)}
				</button>
				{stats && (
					<div className="stat">
						<span className="stat-label">HUD RMS</span>
						<span className="stat-value">{stats.rms.toFixed(2)}</span>
					</div>
				)}
			</div>
			<p className="panel-note">
				<strong>Plugin owns the Worker:</strong> on <code>setData</code> it transfers the Y column
				to a module Worker, gets RMS / min / max back, and paints a dashed RMS line in{" "}
				<code>hooks.draw</code>. The chart host still owns data — the plugin never calls{" "}
				<code>setData</code>.
			</p>
			<Chart data={data} options={options} plugins={plugins} />
			<p className="panel-note" style={{ marginTop: 12 }}>
				Purple dashed line = worker RMS. Corner badge updates from the Worker response.
			</p>
		</DemoShell>
	);
}
