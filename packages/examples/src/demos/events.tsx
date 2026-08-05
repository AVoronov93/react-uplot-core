import { Chart, objectSeriesPaths } from "@ruplot/react";
import { useMemo } from "react";
import type uPlot from "uplot";
import { CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";

type EventMark = { color: string; label: string };

const events: (EventMark | null)[] = [
	null,
	{ color: "#22c55e", label: "ok" },
	null,
	{ color: "#ef4444", label: "alarm" },
	null,
	{ color: "#eab308", label: "warn" },
	null,
	{ color: "#22c55e", label: "ok" },
	null,
	{ color: "#ef4444", label: "alarm" },
];

const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const yMetric = [12, 15, 14, 22, 18, 19, 16, 21, 17, 24];
const yEvents = events.map((e) => (e ? 1 : null));
const data: uPlot.AlignedData = [x, yMetric, yEvents as number[]];

const eventPaths = objectSeriesPaths<EventMark>({
	get: (i) => events[i],
	render: ({ ctx, x: cx, y: cy, value }) => {
		ctx.beginPath();
		ctx.fillStyle = value.color;
		ctx.arc(cx, cy, 5, 0, Math.PI * 2);
		ctx.fill();
	},
});

export type EventsDemoProps = {
	chrome?: boolean;
	stroke?: string;
};

export function EventsDemo({ chrome = true, stroke = "#0ea5e9" }: EventsDemoProps) {
	const options = useMemo<uPlot.Options>(
		() => ({
			width: CHART_W,
			height: 260,
			title: "objectSeriesPaths (events)",
			scales: {
				x: { time: false },
				y: {},
				ev: { auto: false, min: 0, max: 2 },
			},
			axes: [{}, { scale: "y" }, { scale: "ev", show: false }],
			series: [
				{},
				{ label: "Metric", stroke, width: 2, scale: "y" },
				{ label: "Events", scale: "ev", paths: eventPaths, points: { show: false } },
			],
			legend: { show: false },
		}),
		[stroke],
	);

	return (
		<DemoShell chrome={chrome}>
			<p className="panel-note">
				Rich Y objects drawn via custom paths — display numbers stay scale-friendly.
			</p>
			<Chart data={data} options={options}>
				<Chart.Tooltip>
					{({ idx, visible }) => {
						if (!visible || idx == null) return null;
						const ev = events[idx];
						return (
							<div className="demo-tooltip">
								y={yMetric[idx]}
								{ev ? ` · ${ev.label}` : ""}
							</div>
						);
					}}
				</Chart.Tooltip>
			</Chart>
		</DemoShell>
	);
}
