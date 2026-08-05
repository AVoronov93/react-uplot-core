import { Chart, useCursor } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

/** Series with staggered nulls so per-series idxs can diverge from the shared idx. */
function staggeredData(): uPlot.AlignedData {
	const n = 120;
	const x = Array.from({ length: n }, (_, i) => i);
	const sine = x.map((i) => {
		if (i > 40 && i < 55) return null;
		return Math.sin(i / 9) * 8 + 12;
	});
	const cosine = x.map((i) => {
		if (i > 70 && i < 85) return null;
		return Math.cos(i / 11) * 6 + 10;
	});
	return [x, sine as number[], cosine as number[]];
}

const data = staggeredData();

const SERIES = [
	{ label: "Sine", stroke: "#0ea5e9" },
	{ label: "Cosine", stroke: "#f97316" },
] as const;

function CursorValues() {
	const cursor = useCursor();
	const { idx, idxs, left, top } = cursor;

	return (
		<div className="stats" style={{ alignItems: "start" }}>
			<div className="stat">
				<span className="stat-label">shared idx</span>
				<span className="stat-value">{idx ?? "—"}</span>
			</div>
			<div className="stat">
				<span className="stat-label">pointer</span>
				<span className="stat-value small">
					{left.toFixed(0)}, {top.toFixed(0)}
				</span>
			</div>
			{SERIES.map((s, i) => {
				const seriesIdx = idxs?.[i + 1] ?? null;
				const y = seriesIdx == null ? null : (data[i + 1] as (number | null)[])[seriesIdx];
				return (
					<div className="stat" key={s.label}>
						<span className="stat-label" style={{ color: s.stroke }}>
							{s.label}
						</span>
						<span className="stat-value small">
							idx {seriesIdx ?? "—"} ·{" "}
							{y == null ? "gap" : typeof y === "number" ? y.toFixed(2) : y}
						</span>
					</div>
				);
			})}
		</div>
	);
}

export type CursorRichDemoProps = {
	chrome?: boolean;
};

/**
 * Lean useCursor() snapshot includes idxs (per-series nearest points).
 * Values still come from data[s][idxs[s]] — the store does not copy series values.
 */
export function CursorRichDemo({ chrome = true }: CursorRichDemoProps) {
	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title: "Hover — note gaps (nulls) per series",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [
				{},
				{ label: SERIES[0].label, stroke: SERIES[0].stroke, width: 2 },
				{ label: SERIES[1].label, stroke: SERIES[1].stroke, width: 2 },
			],
		}),
		[],
	);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				<strong>
					What you get from <code>useCursor()</code>:
				</strong>{" "}
				<code>{"{ idx, idxs, left, top }"}</code>. <code>idx</code> is the shared cursor index;{" "}
				<code>idxs[s]</code> is that series&apos; nearest non-null point (can differ across gaps).
				Read values with <code>data[s][idxs[s]]</code> — the store stays allocation-light.
			</p>
			<Chart data={data} options={options}>
				<CursorValues />
			</Chart>
		</DemoShell>
	);
}
