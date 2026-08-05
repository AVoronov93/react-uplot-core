import { Chart } from "@ruplot/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

/** Values in thousands (kW-style) so unit / precision toggles are obvious. */
const data: uPlot.AlignedData = [
	Array.from({ length: 80 }, (_, i) => i),
	Array.from({ length: 80 }, (_, i) => 1200 + Math.sin(i / 8) * 450 + Math.cos(i / 15) * 120),
];

export type AxisSlotsDemoProps = {
	chrome?: boolean;
};

type Unit = "kw" | "mw";

/**
 * Axis formatters are slotted — unit / precision / suffix change without recreate.
 * Only `side` is structural (left ↔ right recreates).
 */
export function AxisSlotsDemo({ chrome = true }: AxisSlotsDemoProps) {
	const [unit, setUnit] = useState<Unit>("kw");
	const [decimals, setDecimals] = useState(1);
	const [yOnRight, setYOnRight] = useState(false);
	const [ready, setReady] = useState(0);

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title: "Axis formatter slots",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { label: "Load", stroke: "#0ea5e9", width: 2 }],
			axes: [
				{},
				{
					side: yOnRight ? 1 : 3,
					label: unit === "mw" ? "MW" : "kW",
					values: (_u, splits) =>
						splits.map((v) => {
							const scaled = unit === "mw" ? v / 1000 : v;
							return `${scaled.toFixed(decimals)} ${unit === "mw" ? "MW" : "kW"}`;
						}),
				},
			],
		}),
		[unit, decimals, yOnRight],
	);

	return (
		<DemoShell chrome={chrome}>
			<div className="stats">
				<button
					type="button"
					className="tab"
					onClick={() => setUnit((u) => (u === "kw" ? "mw" : "kw"))}
				>
					Unit: {unit === "kw" ? "kW" : "MW"}
				</button>
				<button
					type="button"
					className="tab"
					onClick={() => setDecimals((d) => (d >= 3 ? 0 : d + 1))}
				>
					Decimals: {decimals}
				</button>
				<button
					type="button"
					className={yOnRight ? "tab active" : "tab"}
					onClick={() => setYOnRight((v) => !v)}
				>
					Y axis: {yOnRight ? "right" : "left"}
				</button>
				<div className="stat">
					<span className="stat-label">onReady</span>
					<span className="stat-value">{ready}</span>
				</div>
			</div>
			<p className="panel-note">
				<strong>Slotted:</strong> kW ↔ MW and decimals update tick labels + title via{" "}
				<code>setUserAxes</code> on <em>either</em> side (<code>onReady</code> stays 1).{" "}
				<strong>Structural:</strong> toggling <code>side</code> (left ↔ right) recreates (
				<code>onReady</code> jumps).
			</p>
			<Chart data={data} options={options} onReady={() => setReady((n) => n + 1)} />
		</DemoShell>
	);
}
