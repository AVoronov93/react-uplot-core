export type Subscriber = () => void;

export type Store<T> = {
	subscribe: (listener: Subscriber) => () => void;
	getSnapshot: () => T;
	getServerSnapshot: () => T;
	setState: (next: T | ((prev: T) => T)) => void;
	/** Replace state without notifying subscribers (init / SSR). */
	replace: (next: T) => void;
};

/**
 * Minimal external store compatible with useSyncExternalStore.
 *
 * WHY: Cursor/scales at 60Hz must not flow through React Context state.
 */
export function createStore<T>(initial: T, serverSnapshot: T = initial): Store<T> {
	let state = initial;
	const server = serverSnapshot;
	const listeners = new Set<Subscriber>();

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
			listeners.forEach((listener) => {
				listener();
			});
		},
		replace(next) {
			state = next;
		},
	};
}
