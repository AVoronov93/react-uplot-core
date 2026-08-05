import { describe, expect, it } from "vitest";
import { createStore } from "./store.js";

describe("createStore", () => {
	it("notifies subscribers on change", () => {
		const store = createStore(0);
		let calls = 0;
		const unsubscribe = store.subscribe(() => {
			calls += 1;
		});

		store.setState(1);
		store.setState(1);
		store.setState((n) => n + 1);
		unsubscribe();
		store.setState(3);

		expect(calls).toBe(2);
		expect(store.getSnapshot()).toBe(3);
	});
});
