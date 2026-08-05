import { Chart, createChartStores } from "@ruplot/react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(60);

/** HUD outside Chart — subscribes to the same stores Chart will hydrate into. */
function CursorHud({ stores }: { stores: ReturnType<typeof createChartStores> }) {
	const snap = useSyncExternalStore(
		stores.cursor.subscribe,
		stores.cursor.getSnapshot,
		stores.cursor.getServerSnapshot,
	);
	return (
		<div className="stats" style={{ marginBottom: 8, borderBottom: "none", paddingBottom: 0 }}>
			<div className="stat">
				<span className="stat-label">HUD idx</span>
				<span className="stat-value">{snap.idx ?? "—"}</span>
			</div>
			<div className="stat">
				<span className="stat-label">left / top</span>
				<span className="stat-value small">
					{snap.left.toFixed(0)} / {snap.top.toFixed(0)}
				</span>
			</div>
		</div>
	);
}

/**
 * Simulates SSR: stores exist before the canvas mounts; HUD reads idle server snapshots.
 */
export function SsrHydrateDemo({ chrome = true }: { chrome?: boolean }) {
	const stores = useMemo(() => createChartStores(), []);
	const [hydrated, setHydrated] = useState(false);
	const serverSnap = stores.cursor.getServerSnapshot();

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title: "Hover me after hydrate",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#0ea5e9", width: 2 }],
		}),
		[],
	);

	useEffect(() => {
		const t = window.setTimeout(() => setHydrated(true), 600);
		return () => clearTimeout(t);
	}, []);

	return (
		<DemoShell chrome={chrome}>
			<div className="stats">
				<div className="stat">
					<span className="stat-label">Phase</span>
					<span className="stat-value small">{hydrated ? "client hydrated" : "SSR shell"}</span>
				</div>
			</div>
			<p className="panel-note">
				<strong>How it works:</strong> on the server call <code>createChartStores()</code> and
				render your HUD from <code>getServerSnapshot()</code> (idle cursor). Ship HTML without a
				canvas. On the client, pass the <strong>same</strong> store instance as{" "}
				<code>{"stores={stores}"}</code> — the HUD is already subscribed; mounting{" "}
				<code>Chart</code> wires uPlot into those stores. Hover updates the HUD above without
				recreating stores.
			</p>
			<div
				style={{
					padding: 12,
					marginBottom: 12,
					background: "#f8fafc",
					border: "1px solid #e2e8f0",
					borderRadius: 8,
					fontSize: 13,
				}}
			>
				<strong>Server snapshot</strong> (stable until client cursor moves):
				<pre style={{ margin: "8px 0 0", fontSize: 12 }}>{JSON.stringify(serverSnap, null, 2)}</pre>
			</div>
			<CursorHud stores={stores} />
			{hydrated ? (
				<Chart data={data} options={options} stores={stores} />
			) : (
				<div
					className="panel-note"
					style={{
						height: CHART_H,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						border: "1px dashed #94a3b8",
						borderRadius: 8,
					}}
				>
					Canvas placeholder — stores + HUD already live
				</div>
			)}
		</DemoShell>
	);
}
