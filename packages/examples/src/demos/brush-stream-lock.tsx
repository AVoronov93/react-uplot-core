import { Chart, streamingWindow, useBrushStreamPolicy } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const CAPACITY = 120;

const seed = (): uPlot.AlignedData => {
	const x = Array.from({ length: CAPACITY }, (_, i) => i);
	return [x, x.map((i) => Math.sin(i / 9) * 8 + 10)];
};

function xExtent(data: uPlot.AlignedData): { xMin: number; xMax: number } {
	const xs = data[0] as number[];
	return { xMin: xs[0]!, xMax: xs[xs.length - 1]! };
}

export type BrushStreamLockDemoProps = {
	chrome?: boolean;
	inspect?: boolean;
};

/**
 * useBrushStreamPolicy — one owner for X (follow XOR brush).
 */
export function BrushStreamLockDemo({
	chrome = true,
	inspect: inspectProp = false,
}: BrushStreamLockDemoProps) {
	const [data, setData] = useState(seed);
	const tick = useRef(CAPACITY);
	const dataRef = useRef(data);
	dataRef.current = data;

	const policy = useBrushStreamPolicy();

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#0ea5e9", width: 2 }],
			cursor: policy.inspect
				? { drag: { setScale: true, x: true, y: false } }
				: { drag: { setScale: false, x: false, y: false } },
		}),
		[policy.inspect],
	);

	const overviewOptions = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 72,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { stroke: "#64748b", width: 1 }],
			cursor: { drag: { setScale: false, x: false, y: false } },
			axes: [{ stroke: "#94a3b8" }, { show: false }],
		}),
		[],
	);

	const enterInspectFromData = () => {
		const { xMin, xMax } = xExtent(dataRef.current);
		policy.enterInspect({ xMin, xMax });
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: Storybook control seed only
	useEffect(() => {
		if (inspectProp) enterInspectFromData();
		else policy.exitInspect();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Storybook control seed
	}, [inspectProp]);

	useEffect(() => {
		if (policy.inspect) return;
		const id = setInterval(() => {
			const t = ++tick.current;
			setData((prev) =>
				streamingWindow({
					buffer: prev,
					chunk: [[t], [Math.sin(t / 9) * 8 + 10]],
					capacity: CAPACITY,
				}),
			);
		}, 250);
		return () => clearInterval(id);
	}, [policy.inspect]);

	const rangeLabel =
		policy.range != null ? `${policy.range.min.toFixed(0)} → ${policy.range.max.toFixed(0)}` : "—";

	return (
		<DemoShell chrome={chrome}>
			<div className="stats">
				<button
					type="button"
					className={policy.inspect ? "tab active" : "tab"}
					onClick={() => {
						if (policy.inspect) policy.exitInspect();
						else enterInspectFromData();
					}}
				>
					{policy.inspect ? "Resume live follow" : "Inspect (lock window)"}
				</button>
				<div className="stat">
					<span className="stat-label">Mode</span>
					<span className="stat-value small">
						{policy.inspect ? "brush owns X" : "stream follows"}
					</span>
				</div>
				{policy.inspect ? (
					<div className="stat">
						<span className="stat-label">Window</span>
						<span className="stat-value small">{rangeLabel}</span>
					</div>
				) : null}
			</div>
			<p className="panel-note">
				<strong>
					<code>useBrushStreamPolicy</code>:
				</strong>{" "}
				live mode follows the stream; inspect mode <strong>pauses data</strong> and follow so the
				brush window stays on visible points. Widen or narrow with grips (detail or overview); drag
				the band to pan.
			</p>
			<Chart data={data} options={options} streaming={policy.streaming}>
				<Chart.Brush {...policy.brush} />
			</Chart>
			{policy.inspect ? (
				<>
					<div style={{ height: 10 }} />
					<p className="panel-note" style={{ marginBottom: 6 }}>
						Overview — full buffer; drag grips to expand or shrink the inspect window.
					</p>
					<Chart data={data} options={overviewOptions}>
						<Chart.Brush {...policy.brush} bindScale={false} showSelect />
					</Chart>
				</>
			) : null}
		</DemoShell>
	);
}
