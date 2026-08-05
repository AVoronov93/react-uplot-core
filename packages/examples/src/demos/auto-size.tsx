import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { sineSeries } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

const data = sineSeries(240);

function SizedChart({ width, height }: { width: number; height: number }) {
	const options = useMemo<uPlot.Options>(
		() => ({
			width,
			height,
			scales: { x: { time: false } },
			legend: { show: false },
			series: [{}, { label: "Responsive", stroke: "#0ea5e9", width: 2 }],
		}),
		[width, height],
	);
	return <Chart data={data} options={options} />;
}

export type AutoSizeDemoProps = {
	chrome?: boolean;
	minWidth?: number;
	minHeight?: number;
};

/**
 * Chart.AutoSize observes both content-box width and height (ResizeObserver).
 * Drag the dashed frame's corner — both dimensions feed into options → setSize.
 */
export function AutoSizeDemo({
	chrome = true,
	minWidth = 320,
	minHeight = 180,
}: AutoSizeDemoProps) {
	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				<strong>AutoSize</strong> measures <em>both</em> width and height of its container (not
				width-only). Resize the dashed frame (↘ corner). Classifier routes size-only updates as{" "}
				<code>setSize</code>.
			</p>
			<div className="auto-size-frame">
				<Chart.AutoSize
					minWidth={minWidth}
					minHeight={minHeight}
					style={{ width: "100%", height: "100%" }}
				>
					{({ width, height }) => (
						<>
							<div
								className="stats"
								style={{ marginBottom: 8, borderBottom: "none", paddingBottom: 0 }}
							>
								<div className="stat">
									<span className="stat-label">width</span>
									<span className="stat-value">{width}px</span>
								</div>
								<div className="stat">
									<span className="stat-label">height</span>
									<span className="stat-value">{height}px</span>
								</div>
							</div>
							<SizedChart width={width} height={height} />
						</>
					)}
				</Chart.AutoSize>
			</div>
		</DemoShell>
	);
}
