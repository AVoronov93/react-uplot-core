import { Chart } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";
const data: uPlot.AlignedData = [Array.from({ length: 100 }, (_, i) => i), Array.from({ length: 100 }, (_, i) => Math.sin(i / 9) * 8 + 10), Array.from({ length: 100 }, (_, i) => Math.cos(i / 12) * 7 + 10)];
export function LegendDemo({ chrome = true }: { chrome?: boolean }) {
	const options = useMemo<uPlot.Options>(() => ({ width: CHART_W, height: CHART_H, scales: { x: { time: false } }, legend: { show: false }, series: [{}, { label: "Sine", stroke: "#0ea5e9", width: 2 }, { label: "Cosine", stroke: "#f97316", width: 2 }] }), []);
	return <DemoShell chrome={chrome}><p className="panel-note"><strong>Chart.Legend:</strong> click a series to hide it without rebuilding <code>options.legend</code> or recreating the chart.</p><Chart data={data} options={options}><Chart.Legend className="tabs" /></Chart></DemoShell>;
}
