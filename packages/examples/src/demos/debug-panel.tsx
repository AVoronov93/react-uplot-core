import { Chart, type ChartRef, type SessionDebugSnapshot } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

/**
 * Live classifier / command counters — uses Chart `debug` + getDebugSnapshot().
 */
export function DebugPanelDemo({ chrome = true }: { chrome?: boolean }) {
	const ref = useRef<ChartRef>(null);
	const [stroke, setStroke] = useState("#0ea5e9");
	const [title, setTitle] = useState("Debug panel");
	const [snap, setSnap] = useState<SessionDebugSnapshot | null>(null);
	const [data, setData] = useState(() => sineSeries(80));

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke, width: 2 }],
		}),
		[stroke, title],
	);

	useEffect(() => {
		const id = setInterval(() => {
			setSnap(ref.current?.getDebugSnapshot() ?? null);
		}, 200);
		return () => clearInterval(id);
	}, []);

	const stats = snap?.stats;

	return (
		<DemoShell chrome={chrome}>
			<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
				<button
					type="button"
					onClick={() => setStroke((s) => (s === "#0ea5e9" ? "#f97316" : "#0ea5e9"))}
				>
					Toggle stroke (patchSeries)
				</button>
				<button
					type="button"
					onClick={() => setTitle((t) => (t === "Debug panel" ? "Recreate me" : "Debug panel"))}
				>
					Toggle title (recreate)
				</button>
				<button type="button" onClick={() => setData(sineSeries(80, { noise: Math.random() }))}>
					New data refs (setData)
				</button>
				<button type="button" onClick={() => ref.current?.session.resetDebugStats()}>
					Reset stats
				</button>
			</div>
			<pre
				style={{
					fontSize: 12,
					background: "#0f172a",
					color: "#e2e8f0",
					padding: 12,
					borderRadius: 6,
					marginBottom: 12,
				}}
			>
				{stats
					? `kind=${snap?.lastKind ?? "—"}  reasons=${JSON.stringify(snap?.lastReasons ?? [])}
recreate=${stats.recreate} setData=${stats.setData} patchSeries=${stats.patchSeries} setSize=${stats.setSize}`
					: "…"}
			</pre>
			<Chart ref={ref} data={data} options={options} debug />
		</DemoShell>
	);
}
