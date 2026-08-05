import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

function multiSeries(n: number): uPlot.AlignedData {
	const x = Array.from({ length: n }, (_, i) => i);
	const a = x.map((i) => Math.sin(i / 8) * 10 + 22);
	const b = x.map((i) => Math.cos(i / 11) * 7 + 18);
	const c = x.map((i) => Math.sin(i / 5) * 4 + Math.cos(i / 13) * 3 + 15);
	return [x, a, b, c];
}

const data = multiSeries(60);

const SERIES = [
	{ label: "Inlet", stroke: "#38bdf8", unit: "°C" },
	{ label: "Outlet", stroke: "#f97316", unit: "°C" },
	{ label: "Ambient", stroke: "#a3e635", unit: "°C" },
] as const;

export type TooltipDemoProps = {
	chrome?: boolean;
	width?: number;
	height?: number;
	/** Show only the minimal tooltip, the styled card, or both. */
	variant?: "basic" | "custom" | "both";
	offsetX?: number;
	offsetY?: number;
};

export function TooltipDemo({
	chrome = true,
	width = CHART_W,
	height = CHART_H,
	variant = "both",
	offsetX = 14,
	offsetY = 10,
}: TooltipDemoProps) {
	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height,
			title: "Hover for tooltip",
			series: [
				{},
				...SERIES.map((s) => ({
					label: s.label,
					stroke: s.stroke,
					width: 2,
				})),
			],
			scales: { x: { time: false } },
			legend: { show: false },
		}),
		[width, height],
	);

	const showBasic = variant === "basic" || variant === "both";
	const showCustom = variant === "custom" || variant === "both";

	return (
		<DemoShell chrome={chrome}>
			{showBasic ? (
				<>
					<p className="panel-note">
						<strong>Minimal:</strong> library positions; you own HTML. Hover a point.
					</p>
					<Chart data={data} options={options}>
						<Chart.Tooltip>
							{({ idx, visible }) => {
								if (!visible || idx == null) return null;
								const x = (data[0] as number[])[idx];
								const y = (data[1] as number[])[idx];
								return (
									<div className="demo-tooltip">
										x={x} · y={y?.toFixed?.(2) ?? y}
									</div>
								);
							}}
						</Chart.Tooltip>
					</Chart>
				</>
			) : null}

			{showBasic && showCustom ? <div style={{ height: 20 }} /> : null}

			{showCustom ? (
				<>
					<p className="panel-note">
						<strong>Custom card:</strong> <code>className</code>, <code>offset</code>, multi-series
						rows, delta vs previous sample — all app-owned markup. By default <code>clamp</code>{" "}
						keeps the card inside the Chart wrapper (flips near edges).
					</p>
					<Chart
						data={data}
						options={{
							...options,
							title: "Styled tooltip (full customization)",
						}}
					>
						<Chart.Tooltip className="tt-shell" offset={{ x: offsetX, y: offsetY }}>
							{({ idx, visible }) => {
								if (!visible || idx == null) return null;
								const x = (data[0] as number[])[idx]!;
								const prev = Math.max(0, idx - 1);
								return (
									<div className="tt-card">
										<header className="tt-card__head">
											<span className="tt-card__kicker">Sample</span>
											<strong className="tt-card__x">t = {x}</strong>
										</header>
										<ul className="tt-card__rows">
											{SERIES.map((s, si) => {
												const seriesIdx = si + 1;
												const y = (data[seriesIdx] as number[])[idx]!;
												const yPrev = (data[seriesIdx] as number[])[prev]!;
												const delta = y - yPrev;
												const up = delta >= 0;
												return (
													<li key={s.label} className="tt-card__row">
														<span className="tt-card__swatch" style={{ background: s.stroke }} />
														<span className="tt-card__label">{s.label}</span>
														<span className="tt-card__value">
															{y.toFixed(2)}
															<span className="tt-card__unit">{s.unit}</span>
														</span>
														<span
															className={up ? "tt-card__delta is-up" : "tt-card__delta is-down"}
														>
															{up ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}
														</span>
													</li>
												);
											})}
										</ul>
										<footer className="tt-card__foot">
											idx {idx} · offset ({offsetX}, {offsetY})
										</footer>
									</div>
								);
							}}
						</Chart.Tooltip>
					</Chart>
				</>
			) : null}
		</DemoShell>
	);
}
