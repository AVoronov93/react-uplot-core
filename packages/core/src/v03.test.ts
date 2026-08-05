import type uPlot from "uplot";
import uPlotLib from "uplot";
import { describe, expect, it } from "vitest";
import { createDataPlane, dualData } from "./data-plane.js";
import { holdForwardAligned, holdForwardGaps, seriesStepped } from "./series.js";
import {
	getSyncGroup,
	joinSyncGroup,
	listSyncPeerIds,
	rebindSyncGroup,
	resetSyncRegistry,
	subscribeSyncGroup,
} from "./sync-registry.js";

describe("SyncRegistry", () => {
	it("tracks join/leave and rebind", () => {
		resetSyncRegistry();
		const leaves: string[] = [];
		const leaveA = joinSyncGroup("g1", {
			id: "a",
			onRebind: () => leaves.push("a"),
		});
		joinSyncGroup("g1", { id: "b" });

		expect(listSyncPeerIds("g1").slice().sort()).toEqual(["a", "b"]);
		expect(getSyncGroup("g1")?.key).toBe("g1");

		let notified = 0;
		const unsub = subscribeSyncGroup("g1", () => {
			notified += 1;
		});

		rebindSyncGroup("g1", "g1-fullscreen");
		expect(getSyncGroup("g1")?.key).toBe("g1-fullscreen");
		expect(leaves).toEqual(["a"]);
		expect(notified).toBeGreaterThan(0);

		leaveA();
		expect(listSyncPeerIds("g1")).toEqual(["b"]);
		unsub();
		resetSyncRegistry();
	});
});

describe("DataPlane", () => {
	it("dualData maps source → display and getSource reads originals", () => {
		type Point = { raw: number; label: string };
		const plane = dualData<Point>({
			x: [0, 1, 2],
			source: [
				null,
				[
					{ raw: 10, label: "a" },
					{ raw: 20, label: "b" },
					{ raw: 30, label: "c" },
				],
			],
			toY: (v) => v.raw / 10,
		});

		expect(Array.from(plane.display[0] as number[])).toEqual([0, 1, 2]);
		expect(Array.from(plane.display[1] as number[])).toEqual([1, 2, 3]);
		expect(plane.getSource(1, 1)).toEqual({ raw: 20, label: "b" });
		expect(plane.getSource(1, 99)).toBeNull();
	});

	it("createDataPlane defaults empty source", () => {
		const display = [
			[0, 1],
			[2, 3],
		] as uPlot.AlignedData;
		const plane = createDataPlane({ display });
		expect(plane.display).toBe(display);
		expect(plane.getSource(1, 0)).toBeNull();
	});
});

describe("series helpers", () => {
	it("holdForwardGaps fills nulls with last value", () => {
		expect(holdForwardGaps([1, null, null, 4, null])).toEqual([1, 1, 1, 4, 4]);
	});

	it("holdForwardAligned leaves x untouched", () => {
		const next = holdForwardAligned([
			[0, 1, 2],
			[5, null, 7],
		] as uPlot.AlignedData);
		expect(Array.from(next[0] as number[])).toEqual([0, 1, 2]);
		expect(Array.from(next[1] as number[])).toEqual([5, 5, 7]);
	});

	it("seriesStepped attaches stepped paths when available", () => {
		expect(uPlotLib.paths.stepped).toBeTypeOf("function");
		const series = seriesStepped({ label: "steps", stroke: "#0ea5e9" });
		expect(series.label).toBe("steps");
		expect(series.paths).toBeTypeOf("function");
	});
});
