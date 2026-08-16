import { describe, expect, it, vi } from "vitest";
import { batchStores, createStore } from "./store.js";

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

	it("store.batch coalesces multiple setState into one notify", () => {
		const store = createStore(0);
		let calls = 0;
		store.subscribe(() => {
			calls += 1;
		});

		store.batch(() => {
			store.setState(1);
			store.setState(2);
			store.setState(3);
			expect(calls).toBe(0);
		});

		expect(calls).toBe(1);
		expect(store.getSnapshot()).toBe(3);
	});

	it("batchStores coalesces notifies across stores (no React batchedUpdates)", () => {
		const a = createStore(0);
		const b = createStore("x");
		const order: string[] = [];
		a.subscribe(() => order.push("a"));
		b.subscribe(() => order.push("b"));

		batchStores(() => {
			a.setState(1);
			b.setState("y");
			a.setState(2);
			expect(order).toEqual([]);
		});

		expect(order).toEqual(["a", "b"]);
		expect(a.getSnapshot()).toBe(2);
		expect(b.getSnapshot()).toBe("y");
	});

	it("nested batchStores flushes once at the outermost end", () => {
		const store = createStore(0);
		const spy = vi.fn();
		store.subscribe(spy);

		batchStores(() => {
			store.setState(1);
			batchStores(() => {
				store.setState(2);
			});
			expect(spy).not.toHaveBeenCalled();
		});

		expect(spy).toHaveBeenCalledTimes(1);
		expect(store.getSnapshot()).toBe(2);
	});
});
