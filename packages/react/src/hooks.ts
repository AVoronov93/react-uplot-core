import type {
	CursorSnapshot,
	ScalesSnapshot,
	SelectSnapshot,
	SeriesVisibilitySnapshot,
	SyncSnapshot,
} from "@ruplot/core";
import { useCallback, useSyncExternalStore } from "react";
import type uPlot from "uplot";
import { useChartHandle } from "./context.js";

function identity<T>(value: T): T {
	return value;
}

/**
 * Imperative access to the uPlot instance / session. Does not subscribe — no re-renders.
 */
export function useUPlot(): {
	getInstance: () => uPlot | null;
	session: ReturnType<typeof useChartHandle>["session"];
} {
	return useChartHandle();
}

export function useCursor(): CursorSnapshot;
export function useCursor<T>(selector: (snap: CursorSnapshot) => T): T;
export function useCursor<T>(
	selector: (snap: CursorSnapshot) => T = identity as (s: CursorSnapshot) => T,
): T {
	const { session } = useChartHandle();
	const store = session.stores.cursor;
	const getSelection = useCallback(() => selector(store.getSnapshot()), [selector, store]);
	const getServerSelection = useCallback(
		() => selector(store.getServerSnapshot()),
		[selector, store],
	);
	return useSyncExternalStore(store.subscribe, getSelection, getServerSelection);
}

export function useScales(): ScalesSnapshot;
export function useScales<T>(selector: (snap: ScalesSnapshot) => T): T;
export function useScales<T>(
	selector: (snap: ScalesSnapshot) => T = identity as (s: ScalesSnapshot) => T,
): T {
	const { session } = useChartHandle();
	const store = session.stores.scales;
	const getSelection = useCallback(() => selector(store.getSnapshot()), [selector, store]);
	const getServerSelection = useCallback(
		() => selector(store.getServerSnapshot()),
		[selector, store],
	);
	return useSyncExternalStore(store.subscribe, getSelection, getServerSelection);
}

export function useSeries(): SeriesVisibilitySnapshot;
export function useSeries<T>(selector: (snap: SeriesVisibilitySnapshot) => T): T;
export function useSeries<T>(
	selector: (snap: SeriesVisibilitySnapshot) => T = identity as (s: SeriesVisibilitySnapshot) => T,
): T {
	const { session } = useChartHandle();
	const store = session.stores.series;
	const getSelection = useCallback(() => selector(store.getSnapshot()), [selector, store]);
	const getServerSelection = useCallback(
		() => selector(store.getServerSnapshot()),
		[selector, store],
	);
	return useSyncExternalStore(store.subscribe, getSelection, getServerSelection);
}

export function useSelection(): SelectSnapshot;
export function useSelection<T>(selector: (snap: SelectSnapshot) => T): T;
export function useSelection<T>(
	selector: (snap: SelectSnapshot) => T = identity as (s: SelectSnapshot) => T,
): T {
	const { session } = useChartHandle();
	const store = session.stores.selection;
	const getSelection = useCallback(() => selector(store.getSnapshot()), [selector, store]);
	const getServerSelection = useCallback(
		() => selector(store.getServerSnapshot()),
		[selector, store],
	);
	return useSyncExternalStore(store.subscribe, getSelection, getServerSelection);
}

export function useSync(): SyncSnapshot;
export function useSync<T>(selector: (snap: SyncSnapshot) => T): T;
export function useSync<T>(
	selector: (snap: SyncSnapshot) => T = identity as (s: SyncSnapshot) => T,
): T {
	const { session } = useChartHandle();
	const store = session.stores.sync;
	const getSelection = useCallback(() => selector(store.getSnapshot()), [selector, store]);
	const getServerSelection = useCallback(
		() => selector(store.getServerSnapshot()),
		[selector, store],
	);
	return useSyncExternalStore(store.subscribe, getSelection, getServerSelection);
}
