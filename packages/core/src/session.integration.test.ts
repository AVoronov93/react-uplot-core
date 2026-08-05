// @vitest-environment jsdom

import type uPlot from "uplot";
import { describe, expect, it } from "vitest";
import { classifyOptions } from "./classifier.js";
import { createChartSession } from "./session.js";

const data: uPlot.AlignedData = [
	[0, 1, 2, 3, 4, 5],
	[1200, 1250, 1300, 1280, 1320, 1290],
];

const baseOptions = (): uPlot.Options => ({
	width: 400,
	height: 200,
	scales: { x: { time: false } },
	legend: { show: false },
	series: [{}, { stroke: "#0ea5e9", width: 2 }],
});

describe("createChartSession integration", () => {
	it("patchSeries keeps stroke as uPlot accessor", () => {
		const target = document.createElement("div");
		document.body.appendChild(target);

		const session = createChartSession({ target, options: baseOptions(), data });
		const instance = session.getInstance()!;

		session.apply([{ type: "patchSeries", index: 1, opts: { stroke: "#f97316" } }]);

		const stroke = instance.series[1]!.stroke as (u: uPlot, seriesIdx: number) => string;
		expect(typeof stroke).toBe("function");
		expect(stroke(instance, 1)).toBe("#f97316");
		expect(() => instance.redraw()).not.toThrow();

		session.destroy();
		target.remove();
	});

	it("setUserAxes reapplies tick formatters (decimals)", () => {
		const target = document.createElement("div");
		document.body.appendChild(target);

		const session = createChartSession({
			target,
			options: {
				...baseOptions(),
				axes: [
					{},
					{
						values: (_u, splits) => splits.map((v) => v.toFixed(1)),
					},
				],
			},
			data,
		});
		const instance = session.getInstance()!;
		const axis = instance.axes[1]!;

		session.setUserAxes([
			{},
			{
				values: (_u, splits) => splits.map((v) => v.toFixed(3)),
			},
		]);

		const values = axis.values as (
			u: uPlot,
			splits: number[],
			axisIdx: number,
			foundSpace: number,
			foundIncr: number,
		) => string[];
		expect(typeof values).toBe("function");
		const sample = values(instance, [1200, 1300], 1, 30, 50);
		expect(sample[0]).toBe("1200.000");

		session.destroy();
		target.remove();
	});

	it("setUserAxes patches axis label without recreate", () => {
		const target = document.createElement("div");
		document.body.appendChild(target);

		const session = createChartSession({
			target,
			options: {
				...baseOptions(),
				axes: [{}, { label: "kW" }],
			},
			data,
		});
		const first = session.getInstance();

		session.setUserAxes([{}, { label: "MW" }]);

		const instance = session.getInstance()!;
		expect(session.getInstance()).toBe(first);
		expect(instance.axes[1]!.label).toBe("MW");

		session.destroy();
		target.remove();
	});
});

describe("classifyOptions legend value equality", () => {
	it("patches stroke when legend is a new object with same values", () => {
		const prev: uPlot.Options = {
			...baseOptions(),
			legend: { show: false },
			series: [{}, { stroke: "#0ea5e9", width: 2 }],
		};
		const next: uPlot.Options = {
			...prev,
			legend: { show: false },
			series: [{}, { stroke: "#f97316", width: 2 }],
		};
		const result = classifyOptions({
			prevOptions: prev,
			nextOptions: next,
			prevData: data,
			nextData: data,
		});
		expect(result.kind).toBe("seriesVisual");
	});
});
