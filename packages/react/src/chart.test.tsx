import { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import type uPlot from "uplot";
import { describe, expect, it } from "vitest";
import { Chart } from "./index.js";

const stableOptions: uPlot.Options = {
	width: 200,
	height: 100,
	scales: { x: { time: false } },
	series: [{}, { stroke: "#0ea5e9" }],
	legend: { show: false },
};

const dataA: uPlot.AlignedData = [
	[0, 1, 2, 3],
	[1, 2, 3, 4],
];

const dataB: uPlot.AlignedData = [
	[0, 1, 2, 3],
	[2, 3, 4, 5],
];

describe("<Chart>", () => {
	it("updates data without recreation and cleans up under StrictMode", async () => {
		const host = document.createElement("div");
		document.body.appendChild(host);
		const root = createRoot(host);

		const instances: uPlot[] = [];

		await act(async () => {
			root.render(
				<StrictMode>
					<Chart
						data={dataA}
						options={stableOptions}
						onReady={(chart) => {
							instances.push(chart);
						}}
					/>
				</StrictMode>,
			);
		});

		expect(host.querySelector(".uplot")).not.toBeNull();
		expect(instances.length).toBeGreaterThan(0);
		const afterMount = instances[instances.length - 1]!;

		await act(async () => {
			root.render(
				<StrictMode>
					<Chart
						data={dataB}
						options={stableOptions}
						resetScales={false}
						onReady={(chart) => {
							instances.push(chart);
						}}
					/>
				</StrictMode>,
			);
		});

		const afterData = instances[instances.length - 1]!;
		expect(afterData).toBe(afterMount);

		const resizedOptions: uPlot.Options = {
			...stableOptions,
			width: 320,
			height: 160,
		};

		await act(async () => {
			root.render(
				<StrictMode>
					<Chart data={dataB} options={resizedOptions} resetScales={false} />
				</StrictMode>,
			);
		});

		expect(afterMount.width).toBe(320);

		await act(async () => {
			root.unmount();
		});
		expect(host.querySelector(".uplot")).toBeNull();
		document.body.removeChild(host);
	});
});
