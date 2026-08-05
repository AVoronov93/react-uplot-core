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
});
