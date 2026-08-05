import { getSyncGroup } from "@ruplot/core";
import { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import type uPlot from "uplot";
import { afterEach, describe, expect, it } from "vitest";
import { Chart, SyncGroup, useSyncGroup } from "./index.js";
import { __resetSyncPeerSeq } from "./sync-group.js";

const options: uPlot.Options = {
	width: 200,
	height: 80,
	scales: { x: { time: false } },
	series: [{}, { stroke: "#0ea5e9" }],
	legend: { show: false },
};

const data: uPlot.AlignedData = [
	[0, 1, 2],
	[1, 2, 3],
];

afterEach(() => {
	__resetSyncPeerSeq();
});

function PeerBadge() {
	const sync = useSyncGroup();
	return (
		<span data-testid="peers">
			{sync.id}:{sync.key}:{sync.peerIds.length}
		</span>
	);
}

describe("Chart.SyncGroup", () => {
	it("injects cursor.sync.key and registers peers", async () => {
		const host = document.createElement("div");
		document.body.appendChild(host);
		const root = createRoot(host);
		const charts: uPlot[] = [];

		await act(async () => {
			root.render(
				<StrictMode>
					<SyncGroup id="plant" syncKey="plant-main">
						<PeerBadge />
						<Chart
							data={data}
							options={options}
							onReady={(u) => {
								charts.push(u);
							}}
						/>
						<Chart data={data} options={options} />
					</SyncGroup>
				</StrictMode>,
			);
		});

		const badge = host.querySelector("[data-testid='peers']");
		expect(badge?.textContent).toMatch(/^plant:plant-main:/);
		expect(Number(badge?.textContent?.split(":")[2])).toBeGreaterThanOrEqual(1);
		expect(charts.length).toBeGreaterThan(0);
		expect(getSyncGroup("plant")?.key).toBe("plant-main");
		expect(host.querySelectorAll(".uplot").length).toBeGreaterThanOrEqual(2);

		await act(async () => {
			root.unmount();
		});
		host.remove();
	});
});
