import { classifyOptions, createChartSession } from "@ruplot/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useMemo, useState } from "react";
import type uPlot from "uplot";
import { describe, expect, it } from "vitest";
import { Chart, type TimeRange, useBrushStreamPolicy } from "./index.js";

const stableBase: uPlot.Options = {
	width: 200,
	height: 120,
	scales: { x: { time: false } },
	legend: { show: false },
	series: [{}, { stroke: "#0ea5e9", width: 2 }],
};

function withSeries(stroke: string): uPlot.Options {
	return {
		...stableBase,
		series: [{}, { stroke, width: 2 }],
	};
}

const data: uPlot.AlignedData = [
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
	[1, 2, 3, 4, 5, 4, 3, 2, 1, 0],
];

describe("composition", () => {
	it("classifies stroke change as patchSeries (same instance path)", () => {
		const result = classifyOptions({
			prevOptions: withSeries("red"),
			nextOptions: withSeries("blue"),
			prevData: data,
			nextData: data,
		});
		expect(result.kind).toBe("seriesVisual");
		expect(result.commands).toEqual([{ type: "patchSeries", index: 1, opts: { stroke: "blue" } }]);
	});

	it("patches stroke on toggle without remounting uPlot", () => {
		const instances: uPlot[] = [];
		function StrokeToggle() {
			const [stroke, setStroke] = useState("#0ea5e9");
			const options = useMemo(() => withSeries(stroke), [stroke]);
			return (
				<>
					<button type="button" onClick={() => setStroke("#f97316")}>
						Toggle stroke
					</button>
					<Chart
						data={data}
						options={{ ...options, legend: { show: false } }}
						onReady={(u) => instances.push(u)}
					/>
				</>
			);
		}

		render(<StrokeToggle />);
		const instance = instances.at(-1)!;
		expect(instance).toBeTruthy();

		fireEvent.click(screen.getByText("Toggle stroke"));

		expect(instances.at(-1)).toBe(instance);
		expect(typeof instance.series[1]!.stroke).toBe("function");
		expect(instance.series[1]!.stroke(instance, 1)).toBe("#f97316");
		expect(() => instance.redraw()).not.toThrow();
	});

	it("slots axis label without recreate", () => {
		const target = document.createElement("div");
		document.body.appendChild(target);
		const opts: uPlot.Options = {
			...stableBase,
			axes: [{}, { label: "kW", values: (_u, splits) => splits.map((v) => v.toFixed(1)) }],
		};
		const session = createChartSession({ target, options: opts, data });
		const first = session.getInstance();
		session.setUserAxes([
			{},
			{ label: "MW", values: (_u, splits) => splits.map((v) => v.toFixed(3)) },
		]);
		const axis = session.getInstance()!.axes[1]!;
		expect(session.getInstance()).toBe(first);
		expect(axis.label).toBe("MW");
		expect(axis.values(session.getInstance()!, [1, 2], 1, 30, 1)[0]).toBe("1.000");
		session.destroy();
		target.remove();
	});

	it("tooltip shell exposes role=tooltip", () => {
		render(
			<Chart data={data} options={stableBase}>
				<Chart.Tooltip>
					{({ visible, idx }) => (visible && idx != null ? <span>idx {idx}</span> : null)}
				</Chart.Tooltip>
			</Chart>,
		);
		const tip = document.querySelector('[role="tooltip"]');
		expect(tip).toBeTruthy();
	});

	it("useBrushStreamPolicy toggles follow vs brush", () => {
		function Probe() {
			const policy = useBrushStreamPolicy({ initialRange: { min: 2, max: 6 } });
			return (
				<div>
					<span data-testid="follow">{String(policy.streaming.follow)}</span>
					<span data-testid="brush-disabled">{String(policy.brush.disabled)}</span>
					<button type="button" onClick={() => policy.enterInspect({ xMin: 0, xMax: 9 })}>
						inspect
					</button>
					<button type="button" onClick={() => policy.exitInspect()}>
						live
					</button>
				</div>
			);
		}
		render(<Probe />);
		expect(screen.getByTestId("follow").textContent).toBe("true");
		expect(screen.getByTestId("brush-disabled").textContent).toBe("true");
		fireEvent.click(screen.getByText("inspect"));
		expect(screen.getByTestId("follow").textContent).toBe("false");
		expect(screen.getByTestId("brush-disabled").textContent).toBe("false");
		fireEvent.click(screen.getByText("live"));
		expect(screen.getByTestId("follow").textContent).toBe("true");
	});

	it("Y brush mounts grips with vertical aria-orientation", () => {
		function YBrush() {
			const [range, setRange] = useState<TimeRange>({ min: 1, max: 4 });
			return (
				<Chart
					data={data}
					options={{
						...stableBase,
						cursor: { drag: { setScale: false, x: false, y: false } },
					}}
				>
					<Chart.Brush
						value={range}
						onChange={setRange}
						orientation="y"
						scaleKey="y"
						bindScale={false}
						grips
						showSelect={false}
					/>
				</Chart>
			);
		}
		render(<YBrush />);
		const grips = document.querySelectorAll('[role="slider"][aria-orientation="vertical"]');
		expect(grips.length).toBe(2);
	});
});
