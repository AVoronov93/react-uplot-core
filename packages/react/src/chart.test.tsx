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

	it("hydrates into pre-created stores (SSR pattern)", async () => {
		const { createChartStores } = await import("./index.js");
		const { useSyncExternalStore } = await import("react");
		const stores = createChartStores();
		expect(stores.cursor.getServerSnapshot().idx).toBeNull();

		function StoreHud() {
			const idx = useSyncExternalStore(
				stores.cursor.subscribe,
				() => stores.cursor.getSnapshot().idx,
				() => stores.cursor.getServerSnapshot().idx,
			);
			return <span data-testid="hud-idx">{idx ?? "idle"}</span>;
		}

		const host = document.createElement("div");
		document.body.appendChild(host);
		const root = createRoot(host);

		// SSR shell: HUD only — getServerSnapshot → idle
		await act(async () => {
			root.render(<StoreHud />);
		});
		expect(host.querySelector("[data-testid=hud-idx]")?.textContent).toBe("idle");

		// Hydrate: same store instance wired into Chart
		await act(async () => {
			root.render(
				<>
					<StoreHud />
					<Chart data={dataA} options={stableOptions} stores={stores} />
				</>,
			);
		});

		expect(host.querySelector(".uplot")).not.toBeNull();
		expect(stores.meta.getSnapshot().ready).toBe(true);
		expect(stores.cursor.getServerSnapshot().idx).toBeNull();

		await act(async () => {
			stores.cursor.setState({ idx: 2, idxs: [null, 2], left: 8, top: 4 });
			await Promise.resolve();
		});
		expect(host.querySelector("[data-testid=hud-idx]")?.textContent).toBe("2");

		await act(async () => {
			root.unmount();
		});
		document.body.removeChild(host);
	});
});
