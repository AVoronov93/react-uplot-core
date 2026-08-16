import { act } from "react";
import { createRoot } from "react-dom/client";
import type uPlot from "uplot";
import { afterEach, describe, expect, it } from "vitest";
import UplotReact from "./compat.js";

const options: uPlot.Options = {
	width: 200,
	height: 100,
	series: [{}, { stroke: "#0ea5e9" }],
	scales: { x: { time: false } },
	legend: { show: false },
};

const data: uPlot.AlignedData = [
	[0, 1, 2],
	[1, 2, 3],
];

describe("@ruplot/react/compat UplotReact", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("mounts, fires onCreate, updates data, fires onDelete on unmount", async () => {
		const host = document.createElement("div");
		document.body.appendChild(host);
		const root = createRoot(host);

		const created: uPlot[] = [];
		const deleted: uPlot[] = [];

		await act(async () => {
			root.render(
				<UplotReact
					options={options}
					data={data}
					onCreate={(u) => created.push(u)}
					onDelete={(u) => deleted.push(u)}
					resetScales={false}
				/>,
			);
		});

		expect(created.length).toBeGreaterThanOrEqual(1);
		const first = created[0]!;
		expect(first.data[0]?.length).toBe(3);

		const next: uPlot.AlignedData = [
			[0, 1, 2, 3],
			[1, 2, 3, 4],
		];
		await act(async () => {
			root.render(
				<UplotReact
					options={options}
					data={next}
					onCreate={(u) => created.push(u)}
					onDelete={(u) => deleted.push(u)}
					resetScales={false}
				/>,
			);
		});

		expect(first.data[0]?.length).toBe(4);

		await act(async () => {
			root.unmount();
		});

		expect(deleted.length).toBe(1);
		expect(deleted[0]).toBe(first);
	});

	it("hosts into an external target when provided", async () => {
		const target = document.createElement("div");
		document.body.appendChild(target);
		const host = document.createElement("div");
		document.body.appendChild(host);
		const root = createRoot(host);

		let instance: uPlot | null = null;
		await act(async () => {
			root.render(
				<UplotReact
					options={options}
					data={data}
					target={target}
					onCreate={(u) => {
						instance = u;
					}}
				/>,
			);
		});

		expect(instance).not.toBeNull();
		expect(target.querySelector("canvas")).toBeTruthy();

		await act(async () => {
			root.unmount();
		});
	});
});
