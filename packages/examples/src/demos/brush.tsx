import { Chart, type TimeRange } from "@ruplot/react";
import { useEffect, useId, useMemo, useState } from "react";
import type uPlot from "uplot";
import { CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(500);
const xs = data[0] as number[];
const ys = data[1] as number[];

const X_MIN = xs[0]!;
const X_MAX = xs[xs.length - 1]!;

/** Stable full-series path; window pans via viewBox (no per-drag rebuild / Y-rescale). */
const MINIMAP_PATH = (() => {
	let yMin = Number.POSITIVE_INFINITY;
	let yMax = Number.NEGATIVE_INFINITY;
	for (const y of ys) {
		if (y < yMin) yMin = y;
		if (y > yMax) yMax = y;
	}
	const span = Math.max(yMax - yMin, 1e-6);
	const pad = 4;
	const h = 40 - pad * 2;
	let d = "";
	for (let i = 0; i < xs.length; i++) {
		const x = xs[i]!;
		const y = pad + (1 - (ys[i]! - yMin) / span) * h;
		d += `${i === 0 ? "M" : "L"}${x} ${y.toFixed(2)} `;
	}
	d += `L${X_MAX} ${pad + h} L${X_MIN} ${pad + h} Z`;
	return d;
})();

function BandMinimap({ range }: { range: TimeRange }) {
	const gradId = useId().replace(/:/g, "");
	const span = Math.max(range.max - range.min, 1e-6);

	return (
		<svg
			className="brush-minimap"
			viewBox={`${range.min} 0 ${span} 40`}
			preserveAspectRatio="none"
			role="presentation"
			aria-hidden
		>
			<defs>
				<linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
					<stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
				</linearGradient>
			</defs>
			<path
				d={MINIMAP_PATH}
				fill={`url(#${gradId})`}
				stroke="#7dd3fc"
				strokeWidth="1.25"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}

export type BrushDemoProps = {
	chrome?: boolean;
	rangeMin?: number;
	rangeMax?: number;
	stroke?: string;
	/** Classic pair, semicircle+minimap showcase, or both. */
	variant?: "basic" | "custom" | "both";
	gripWidth?: number;
};

export function BrushDemo({
	chrome = true,
	rangeMin = 120,
	rangeMax = 220,
	stroke = "#0ea5e9",
	variant = "both",
	gripWidth = 18,
}: BrushDemoProps) {
	const [range, setRange] = useState<TimeRange>({ min: rangeMin, max: rangeMax });
	const [frame, setFrame] = useState<TimeRange>({ min: 80, max: 200 });

	useEffect(() => {
		setRange({ min: rangeMin, max: rangeMax });
	}, [rangeMin, rangeMax]);

	const detailOptions = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 200,
			title: "Detail (bindScale)",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { label: "Signal", stroke, width: 2 }],
			cursor: { drag: { x: true, y: false } },
		}),
		[stroke],
	);

	const overviewOptions = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 96,
			title: "Overview (grips)",
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#64748b", width: 1 }],
			cursor: { drag: { setScale: false, x: false, y: false } },
		}),
		[],
	);

	const customDetail = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 220,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { label: "Signal", stroke: "#e2e8f0", width: 2 }],
			cursor: { drag: { x: true, y: false } },
			axes: [
				{
					stroke: "#94a3b8",
					grid: { stroke: "rgba(148,163,184,0.18)" },
					ticks: { stroke: "#64748b" },
				},
				{
					stroke: "#94a3b8",
					grid: { stroke: "rgba(148,163,184,0.12)" },
					ticks: { stroke: "#64748b" },
				},
			],
		}),
		[],
	);

	/** Full-history strip under the detail — dim line; window chrome is custom Brush. */
	const customOverview = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 64,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "rgba(148,163,184,0.35)", width: 1 }],
			cursor: { drag: { setScale: false, x: false, y: false } },
			axes: [{ show: false }, { show: false }],
		}),
		[],
	);

	const showBasic = variant === "basic" || variant === "both";
	const showCustom = variant === "custom" || variant === "both";

	return (
		<DemoShell chrome={chrome}>
			{showBasic ? (
				<>
					<p className="panel-note">
						<strong>Basic:</strong> shared range {range.min.toFixed(0)}–{range.max.toFixed(0)} —
						drag grips or zoom detail.
					</p>
					<Chart data={data} options={detailOptions}>
						<Chart.Brush value={range} onChange={setRange} />
					</Chart>
					<div style={{ height: 12 }} />
					<Chart data={data} options={overviewOptions}>
						<Chart.Brush value={range} onChange={setRange} bindScale={false} grips showSelect />
					</Chart>
				</>
			) : null}

			{showBasic && showCustom ? <div style={{ height: 28 }} /> : null}

			{showCustom ? (
				<>
					<p className="panel-note">
						<strong>Custom frame:</strong> semicircle grips + sparkline minimap in{" "}
						<code>Brush</code> children (<code>{"showSelect={false}"}</code>). Window{" "}
						{frame.min.toFixed(0)}–{frame.max.toFixed(0)}.
					</p>
					<div className="brush-stage">
						<div className="brush-stage__label">Detail</div>
						<Chart data={data} options={customDetail}>
							<Chart.Brush value={frame} onChange={setFrame} />
						</Chart>
						<div className="brush-stage__label brush-stage__label--frame">
							Frame selector · drag the caps
						</div>
						<div className="brush-frame">
							<Chart data={data} options={customOverview}>
								<Chart.Brush
									value={frame}
									onChange={setFrame}
									bindScale={false}
									grips
									showSelect={false}
									gripWidth={gripWidth}
									bandClassName="brush-band--window"
									gripClassName="brush-grip--semi"
									bandStyle={{
										background: "rgba(15, 23, 42, 0.72)",
										borderLeft: "none",
										borderRight: "none",
										borderRadius: 0,
										boxShadow: "0 0 0 1px rgba(125, 211, 252, 0.45), 0 8px 24px rgba(0,0,0,0.35)",
									}}
									gripStyle={{
										background: "linear-gradient(180deg, #f8fafc 0%, #94a3b8 100%)",
										boxShadow: "0 0 0 1px rgba(15,23,42,0.5), 0 4px 14px rgba(56,189,248,0.35)",
									}}
								>
									<BandMinimap range={frame} />
								</Chart.Brush>
							</Chart>
						</div>
						<div className="brush-stage__meta">
							<span>
								window{" "}
								<strong>
									{frame.min.toFixed(0)} → {frame.max.toFixed(0)}
								</strong>
							</span>
							<span>
								width <strong>{(frame.max - frame.min).toFixed(0)}</strong>
							</span>
							<span>
								gripWidth <strong>{gripWidth}px</strong>
							</span>
						</div>
					</div>
				</>
			) : null}
		</DemoShell>
	);
}
