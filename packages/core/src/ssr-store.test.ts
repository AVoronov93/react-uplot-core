import { describe, expect, it } from "vitest";
import { createStore } from "./store.js";
import { createChartStores } from "./stores.js";

describe("SSR snapshots", () => {
	it("getServerSnapshot stays stable and distinct from client mutations", () => {
		const store = createStore({ n: 0 }, { n: -1 });
		expect(store.getServerSnapshot()).toEqual({ n: -1 });
		store.setState({ n: 42 });
		expect(store.getSnapshot()).toEqual({ n: 42 });
		expect(store.getServerSnapshot()).toEqual({ n: -1 });
	});

	it("chart stores expose idle cursor server snapshot", () => {
		const stores = createChartStores();
		const server = stores.cursor.getServerSnapshot();
		expect(server.idx).toBeNull();
		expect(server.idxs).toBeNull();
		expect(server.left).toBeLessThan(0);
		stores.cursor.setState({ idx: 3, idxs: [null, 3], left: 10, top: 20 });
		expect(stores.cursor.getServerSnapshot().idx).toBeNull();
	});

	it("pre-created stores keep the same instance for client hydrate", () => {
		const stores = createChartStores();
		const serverCursor = stores.cursor.getServerSnapshot();
		expect(serverCursor.idx).toBeNull();

		// Simulate client: same store object, live snapshot still idle until uPlot wires in.
		expect(stores.cursor.getSnapshot()).toBe(stores.cursor.getSnapshot());
		expect(stores.cursor.getSnapshot().idx).toBeNull();

		stores.cursor.setState({ idx: 1, idxs: [null, 1], left: 40, top: 12 });
		expect(stores.cursor.getSnapshot().idx).toBe(1);
		// Server snapshot must not change — useSyncExternalStore hydrate contract.
		expect(stores.cursor.getServerSnapshot()).toEqual(serverCursor);
	});
});
