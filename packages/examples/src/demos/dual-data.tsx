import { Chart, dualData } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

type Point = { raw: number; unit: string; label: string };

const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const source: (readonly Point[] | null)[] = [
	null,
	x.map((t) => ({
		raw: 100 + Math.sin(t) * 40,
		unit: "psi",
		label: `sensor-${t}`,
	})),
];

const max = Math.max(...source[1]!.map((p) => p.raw));
const plane = dualData({
	x,
	source,
	toY: (p) => p.raw / max,
});

export type DualDataDemoProps = {
	chrome?: boolean;
	stroke?: string;
};

export function DualDataDemo({ chrome = true, stroke = "#0ea5e9" }: DualDataDemoProps) {
	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: CHART_H,
			title: "Normalized display · raw via getSource",
			series: [{}, { label: "Normalized", stroke, width: 2 }],
			scales: { x: { time: false }, y: { min: 0, max: 1 } },
			legend: { show: false },
		}),
		[stroke],
	);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				Canvas shows 0–1; tooltip reads originals from <code>dataPlane.getSource</code>.
			</p>
			<Chart data={plane.display} dataPlane={plane} options={options}>
				<Chart.Tooltip>
					{({ idx, visible }) => {
						if (!visible || idx == null) return null;
						const raw = plane.getSource(1, idx);
						if (!raw) return null;
						return (
							<div className="demo-tooltip">
								{raw.label}: {raw.raw.toFixed(1)} {raw.unit}
							</div>
						);
					}}
				</Chart.Tooltip>
			</Chart>
		</DemoShell>
	);
}
