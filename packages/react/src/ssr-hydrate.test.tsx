// @vitest-environment jsdom

import { createChartStores } from "@ruplot/core";
import { act, render, screen } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import type uPlot from "uplot";
import { describe, expect, it } from "vitest";
import { Chart } from "./index.js";

const options: uPlot.Options = {
	width: 200,
	height: 100,
	scales: { x: { time: false } },
	series: [{}, { stroke: "#0ea5e9" }],
	legend: { show: false },
};

const data: uPlot.AlignedData = [
	[0, 1, 2],
	[1, 2, 3],
];

function Hud({ stores }: { stores: ReturnType<typeof createChartStores> }) {
	const idx = useSyncExternalStore(
		stores.cursor.subscribe,
		() => stores.cursor.getSnapshot().idx,
		() => stores.cursor.getServerSnapshot().idx,
	);
	return <span data-testid="hud-idx">{idx == null ? "idle" : String(idx)}</span>;
}

describe("SSR hydrate with pre-created stores", () => {
	it("HUD reads getServerSnapshot before Chart mounts, then shares the same stores", async () => {
		const stores = createChartStores();
		expect(stores.cursor.getServerSnapshot().idx).toBeNull();

		const { rerender } = render(
			<>
				<Hud stores={stores} />
				<div data-testid="placeholder">no canvas</div>
			</>,
		);

		expect(screen.getByTestId("hud-idx").textContent).toBe("idle");

		await act(async () => {
			rerender(
				<>
					<Hud stores={stores} />
					<Chart data={data} options={options} stores={stores} />
				</>,
			);
		});

		expect(document.querySelector(".uplot")).not.toBeNull();
		// Still idle until cursor moves — but stores are the same instance Chart wired.
		expect(screen.getByTestId("hud-idx").textContent).toBe("idle");
		expect(stores.meta.getSnapshot().ready).toBe(true);

		await act(async () => {
			stores.cursor.setState({ idx: 2, idxs: [null, 2], left: 10, top: 10 });
		});
		expect(screen.getByTestId("hud-idx").textContent).toBe("2");
		expect(stores.cursor.getServerSnapshot().idx).toBeNull();
	});
});
