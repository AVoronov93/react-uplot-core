import { Chart, createPlugin } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W, sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(40);

export type CustomPluginDemoProps = {
	chrome?: boolean;
	stroke?: string;
};

/**
 * Plugin DOM lifecycle: recreate (title / plugin identity) destroys + inits;
 * stroke patches in place and leaves the plugin alive.
 */
export function CustomPluginDemo({
	chrome = true,
	stroke: strokeProp = "#0ea5e9",
}: CustomPluginDemoProps) {
	const [stroke, setStroke] = useState(strokeProp);
	const [nonce, setNonce] = useState(0);
	const [altTitle, setAltTitle] = useState(false);
	const initCount = useRef(0);
	const destroyCount = useRef(0);
	const initEl = useRef<HTMLSpanElement>(null);
	const destroyEl = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		setStroke(strokeProp);
	}, [strokeProp]);

	const plugins = useMemo(() => {
		const badgePlugin = createPlugin({
			key: "corner-badge",
			init({ u }) {
				initCount.current += 1;
				if (initEl.current) initEl.current.textContent = String(initCount.current);

				const el = document.createElement("div");
				el.textContent = `plugin alive · init #${initCount.current}`;
				el.style.cssText =
					"position:absolute;top:8px;right:8px;z-index:3;background:#0f172a;color:#e2e8f0;font:11px sans-serif;padding:4px 8px;border-radius:4px;pointer-events:none;";
				u.root.style.position = "relative";
				u.root.appendChild(el);
				return () => {
					destroyCount.current += 1;
					if (destroyEl.current) destroyEl.current.textContent = String(destroyCount.current);
					el.remove();
				};
			},
		});
		return [badgePlugin];
	}, [nonce]);

	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title: altTitle ? "Plugin DOM lifecycle (B)" : "Plugin DOM lifecycle",
			series: [{}, { label: "Signal", stroke, width: 2 }],
			scales: { x: { time: false } },
			legend: { show: false },
		}),
		[stroke, altTitle],
	);

	return (
		<DemoShell chrome={chrome}>
			<div className="stats" style={{ marginBottom: 8 }}>
				<div className="stat">
					<span className="stat-label">init()</span>
					<span className="stat-value accent" ref={initEl}>
						0
					</span>
				</div>
				<div className="stat">
					<span className="stat-label">destroy()</span>
					<span className="stat-value" ref={destroyEl}>
						0
					</span>
				</div>
			</div>
			<div className="tabs" style={{ marginBottom: 12 }}>
				<button
					type="button"
					className="tab"
					onClick={() => setStroke((s) => (s === "#0ea5e9" ? "#f97316" : "#0ea5e9"))}
				>
					Change stroke (patchSeries)
				</button>
				<button type="button" className="tab" onClick={() => setAltTitle((t) => !t)}>
					Change title (recreate)
				</button>
				<button type="button" className="tab" onClick={() => setNonce((n) => n + 1)}>
					Replace plugin instance
				</button>
			</div>
			<p className="panel-note">
				<strong>What this is:</strong> <code>createPlugin</code> mounts a DOM badge in{" "}
				<code>init</code> and removes it in the returned cleanup. Title / plugin identity →{" "}
				<strong>recreate</strong> → destroy then init (no orphan nodes). Stroke →{" "}
				<code>patchSeries</code> — plugin stays alive.
			</p>
			<Chart data={data} options={options} plugins={plugins} />
		</DemoShell>
	);
}
