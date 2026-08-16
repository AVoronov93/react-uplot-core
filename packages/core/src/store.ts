export type Subscriber = () => void;

export type Store<T> = {
	subscribe: (listener: Subscriber) => () => void;
	getSnapshot: () => T;
	getServerSnapshot: () => T;
	setState: (next: T | ((prev: T) => T)) => void;
	/** Replace state without notifying subscribers (init / SSR). */
	replace: (next: T) => void;
	/**
	 * Run updates without notifying until `fn` returns.
	 * Nested calls coalesce; notifications flush once at the outermost exit.
	 * Prefer {@link batchStores} when updating several stores in one turn.
	 */
	batch: (fn: () => void) => void;
};

let batchDepth = 0;
const pendingNotifies = new Set<() => void>();

function flushPendingNotifies(): void {
	if (pendingNotifies.size === 0) return;
	const list = [...pendingNotifies];
	pendingNotifies.clear();
	for (const notify of list) {
		notify();
	}
}

/**
 * Coalesce notifications across one or more stores.
 *
 * WHY: a single uPlot turn may update cursor + scales + selection. Without
 * batching, each `setState` notifies immediately → multiple React
 * `useSyncExternalStore` updates. Plain sync barrier — no React
 * `unstable_batchedUpdates`.
 *
 * Snapshots update immediately inside `fn`; listeners run once when the
 * outermost batch completes (safe for `useSyncExternalStore`).
 */
export function batchStores(fn: () => void): void {
	beginStoreBatch();
	try {
		fn();
	} finally {
		endStoreBatch();
	}
}

/** Open a batch (nestable). Pair with {@link endStoreBatch}. */
export function beginStoreBatch(): void {
	batchDepth += 1;
}

/** Close a batch; flush listeners when depth returns to 0. */
export function endStoreBatch(): void {
	batchDepth -= 1;
	if (batchDepth < 0) {
		batchDepth = 0;
	}
	if (batchDepth === 0) {
		flushPendingNotifies();
	}
}

/**
 * Minimal external store compatible with useSyncExternalStore.
 *
 * WHY: Cursor/scales at 60Hz must not flow through React Context state.
 */
export function createStore<T>(initial: T, serverSnapshot: T = initial): Store<T> {
	let state = initial;
	const server = serverSnapshot;
	const listeners = new Set<Subscriber>();

	const notify = () => {
		listeners.forEach((listener) => {
			listener();
		});
	};

	return {
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		getSnapshot() {
			return state;
		},
		getServerSnapshot() {
			return server;
		},
		setState(next) {
			const value = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
			if (Object.is(value, state)) return;
			state = value;
			if (batchDepth > 0) {
				pendingNotifies.add(notify);
			} else {
				notify();
			}
		},
		replace(next) {
			state = next;
		},
		batch(fn) {
			batchStores(fn);
		},
	};
}
