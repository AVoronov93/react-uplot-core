import { Chart, type ChartRef } from "@ruplot/react";
import { type CSSProperties, type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { UPlot } from "react-uplot";
import type uPlot from "uplot";
import UplotReact from "uplot-react";

const CHART_H = 140;
const COLORS = ["#0ea5e9", "#f97316", "#a855f7"] as const;

const data: uPlot.AlignedData = [
	Array.from({ length: 40 }, (_, i) => i),
	Array.from({ length: 40 }, (_, i) => Math.sin(i / 5) * 10 + 12),
];

function useSlotWidth(fallback = 260) {
	const ref = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(fallback);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const measure = () => {
			const next = Math.floor(el.clientWidth);
			if (next > 0) setWidth(next);
		};

		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	return { ref, width };
}

function LaneShell({
	name,
	note,
	remountsEl,
	instanceEl,
	children,
}: {
	name: string;
	note: string;
	remountsEl: RefObject<HTMLSpanElement | null>;
	instanceEl?: RefObject<HTMLSpanElement | null>;
	children: ReactNode;
}) {
	return (
		<div
			style={{
				border: "1px solid #cbd5e1",
				borderRadius: 8,
				padding: 12,
				background: "#fff",
				minWidth: 0,
				overflow: "hidden",
			}}
		>
			<div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
				<strong style={{ fontSize: 14 }}>{name}</strong>
				<span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
					remounts{" "}
					<span ref={remountsEl} style={{ fontWeight: 700 }}>
						0
					</span>
					{instanceEl ? (
						<>
							{" · "}
							<span ref={instanceEl} style={{ color: "#64748b" }}>
								instance —
							</span>
						</>
					) : null}
				</span>
			</div>
			<p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>{note}</p>
			{children}
		</div>
	);
}

function bump(el: RefObject<HTMLSpanElement | null>, count: { current: number }) {
	count.current += 1;
	if (el.current) el.current.textContent = String(count.current);
}

const slotStyle: CSSProperties = {
	width: "100%",
	maxWidth: "100%",
	overflow: "hidden",
};

function RuplotLane({ stroke }: { stroke: string }) {
	const { ref, width } = useSlotWidth();
	const remounts = useRef(0);
	const remountsEl = useRef<HTMLSpanElement>(null);
	const instanceEl = useRef<HTMLSpanElement>(null);
	const chartRef = useRef<ChartRef>(null);
	const instanceRef = useRef<uPlot | null>(null);

	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height: CHART_H,
			series: [{}, { stroke, width: 2 }],
			scales: { x: { time: false } },
			legend: { show: false },
		}),
		[width, stroke],
	);

	useEffect(() => {
		const u = chartRef.current?.getInstance() ?? null;
		if (!u || !instanceEl.current) return;
		if (instanceRef.current === null) {
			instanceRef.current = u;
			instanceEl.current.textContent = "mounted";
		} else if (instanceRef.current === u) {
			instanceEl.current.textContent = "same instance (patched)";
		} else {
			instanceEl.current.textContent = "new instance";
			instanceRef.current = u;
		}
	}, [stroke]);

	return (
		<LaneShell
			name="@ruplot/react"
			note="patchSeries — onReady should not climb on toggle (2 in dev = Strict Mode mount)."
			remountsEl={remountsEl}
			instanceEl={instanceEl}
		>
			<div ref={ref} style={slotStyle}>
				<Chart
					ref={chartRef}
					data={data}
					options={options}
					onReady={() => bump(remountsEl, remounts)}
				/>
			</div>
		</LaneShell>
	);
}

function UplotReactLane({ stroke }: { stroke: string }) {
	const { ref, width } = useSlotWidth();
	const remounts = useRef(0);
	const remountsEl = useRef<HTMLSpanElement>(null);

	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height: CHART_H,
			series: [{}, { stroke, width: 2 }],
			scales: { x: { time: false } },
			legend: { show: false },
		}),
		[width, stroke],
	);

	return (
		<LaneShell
			name="uplot-react"
			note="options identity change → onCreate each toggle."
			remountsEl={remountsEl}
		>
			<div ref={ref} style={slotStyle}>
				<UplotReact data={data} options={options} onCreate={() => bump(remountsEl, remounts)} />
			</div>
		</LaneShell>
	);
}

function ReactUplotLane({ stroke }: { stroke: string }) {
	const { ref, width } = useSlotWidth();
	const remounts = useRef(0);
	const remountsEl = useRef<HTMLSpanElement>(null);
	const chartRef = useRef<uPlot | null>(null);

	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height: CHART_H,
			series: [{}, { stroke, width: 2 }],
			scales: { x: { time: false } },
			legend: { show: false },
			hooks: {
				init: [() => bump(remountsEl, remounts)],
			},
		}),
		[width, stroke],
	);

	return (
		<LaneShell
			name="react-uplot"
			note="hooks in options → new instance each toggle."
			remountsEl={remountsEl}
		>
			<div ref={ref} style={slotStyle}>
				<div style={{ width, height: CHART_H, maxWidth: "100%", overflow: "hidden" }}>
					<UPlot data={data} options={options} chartRef={chartRef} />
				</div>
			</div>
		</LaneShell>
	);
}

export function UpdateCompare() {
	const [colorIndex, setColorIndex] = useState(0);
	const stroke = COLORS[colorIndex % COLORS.length]!;

	return (
		<div style={{ fontFamily: "system-ui", maxWidth: 1100 }}>
			<p style={{ marginTop: 0, lineHeight: 1.45, color: "#334155" }}>
				One button toggles <strong>stroke</strong> in all lanes. <strong>remounts</strong> ={" "}
				<code>onReady</code> / <code>onCreate</code> / <code>hooks.init</code> calls. ruplot should
				keep the <em>same instance (patched)</em> while wrappers climb every click.
			</p>
			<button
				type="button"
				style={{ marginBottom: 12, padding: "6px 14px", fontSize: 14 }}
				onClick={() => setColorIndex((n) => n + 1)}
			>
				Toggle stroke (all lanes)
			</button>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
					gap: 12,
				}}
			>
				<RuplotLane stroke={stroke} />
				<UplotReactLane stroke={stroke} />
				<ReactUplotLane stroke={stroke} />
			</div>
		</div>
	);
}
