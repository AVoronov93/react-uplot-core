import { describe, expect, it, vi } from "vitest";
import type { ChartCommand } from "./commands.js";
import { createSessionDebugController, tallyCommands } from "./debug.js";

describe("session debug", () => {
	it("tallies nested batch commands", () => {
		const stats = {
			recreate: 0,
			setData: 0,
			setSize: 0,
			setScale: 0,
			setSeries: 0,
			patchSeries: 0,
			setCursor: 0,
			setSelect: 0,
			batch: 0,
		};
		const cmds: ChartCommand[] = [
			{
				type: "batch",
				commands: [
					{ type: "setData", data: [[0], [1]], resetScales: false },
					{ type: "patchSeries", index: 1, opts: { stroke: "red" } },
				],
			},
		];
		tallyCommands(stats, cmds);
		expect(stats.batch).toBe(1);
		expect(stats.setData).toBe(1);
		expect(stats.patchSeries).toBe(1);
	});

	it("records recreate reasons when logging", () => {
		const info = vi.spyOn(console, "info").mockImplementation(() => {});
		const debug = createSessionDebugController();
		debug.enabled = true;
		debug.log = true;
		debug.recordApply({
			kind: "recreate",
			reasons: ["options.title"],
			applied: [{ type: "recreate", options: { width: 1, height: 1, series: [{}] }, data: [[]] }],
		});
		expect(debug.getSnapshot().stats.recreate).toBe(1);
		expect(debug.getSnapshot().lastReasons).toEqual(["options.title"]);
		expect(info).toHaveBeenCalled();
		info.mockRestore();
	});
});
