import {
	getSyncGroup,
	joinSyncGroup,
	listSyncPeerIds,
	rebindSyncGroup,
	resetSyncRegistry,
	subscribeSyncGroup,
} from "@ruplot/core";
import {
	type ReactNode,
	createContext,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";

export type SyncGroupContextValue = {
	/** Logical group id (stable across fullscreen layout swaps). */
	id: string;
	/** Key passed to uPlot cursor.sync.key (may differ from id after rebind). */
	key: string;
	/** Sync series show/focus across peers (uPlot default). */
	setSeries: boolean;
};

const SyncGroupContext = createContext<SyncGroupContextValue | null>(null);

export type SyncGroupProps = {
	id: string;
	/**
	 * Override the uPlot sync key. Change this on fullscreen / layout swap
	 * without inventing ad-hoc keys in the app.
	 */
	syncKey?: string;
	setSeries?: boolean;
	children: ReactNode;
};

/**
 * Declares a cursor.sync membership boundary for descendant charts.
 *
 * Charts inside join `SyncRegistry` and inject `cursor.sync.key` into options.
 * Pass a new `syncKey` (or call `rebind`) when the layout identity changes.
 */
export function SyncGroup({
	id,
	syncKey,
	setSeries = true,
	children,
}: SyncGroupProps) {
	const key = syncKey ?? id;

	useLayoutEffect(() => {
		rebindSyncGroup(id, key);
	}, [id, key]);

	const value = useMemo(
		(): SyncGroupContextValue => ({ id, key, setSeries }),
		[id, key, setSeries],
	);

	return <SyncGroupContext.Provider value={value}>{children}</SyncGroupContext.Provider>;
}

export function useSyncGroupContext(): SyncGroupContextValue | null {
	return useContext(SyncGroupContext);
}

export type SyncGroupHandle = {
	id: string | null;
	key: string | null;
	peerIds: readonly string[];
	/** Rebind the uPlot sync key for this logical group. */
	rebind: (nextKey: string) => void;
};

const EMPTY_PEERS: readonly string[] = [];

/**
 * Membership + key API for a sync group.
 * Prefer nesting under `<Chart.SyncGroup>`; pass `groupId` to target another group.
 */
export function useSyncGroup(groupId?: string): SyncGroupHandle {
	const ctx = useSyncGroupContext();
	const id = groupId ?? ctx?.id ?? null;

	const peerIds = useSyncExternalStore(
		(onStoreChange) => {
			if (!id) return () => {};
			return subscribeSyncGroup(id, onStoreChange);
		},
		() => (id ? listSyncPeerIds(id) : EMPTY_PEERS),
		() => EMPTY_PEERS,
	);

	const key = id ? (getSyncGroup(id)?.key ?? ctx?.key ?? id) : (ctx?.key ?? null);

	return {
		id,
		key,
		peerIds,
		rebind(nextKey: string) {
			if (!id) return;
			rebindSyncGroup(id, nextKey);
		},
	};
}

let peerSeq = 0;

/** Stable per-Chart peer id for SyncRegistry membership. */
export function allocateSyncPeerId(): string {
	peerSeq += 1;
	return `ruplot-peer-${peerSeq}`;
}

type SyncStore = {
	setState: (next: { group: string | null; peerIds: readonly string[] }) => void;
};

/**
 * Join a sync group for the lifetime of a chart mount.
 * Updates the chart's sync store with membership.
 */
export function useSyncMembership(args: {
	groupId: string | null;
	storesSync: SyncStore;
}): string | null {
	const peerIdRef = useRef<string | null>(null);
	if (peerIdRef.current === null) {
		peerIdRef.current = allocateSyncPeerId();
	}
	const peerId = peerIdRef.current;
	const { groupId, storesSync } = args;

	useLayoutEffect(() => {
		if (!groupId) {
			storesSync.setState({ group: null, peerIds: [] });
			return;
		}

		const refresh = () => {
			storesSync.setState({
				group: groupId,
				peerIds: listSyncPeerIds(groupId),
			});
		};

		const leave = joinSyncGroup(groupId, {
			id: peerId,
			onRebind: refresh,
		});
		refresh();

		return () => {
			leave();
			storesSync.setState({
				group: null,
				peerIds: listSyncPeerIds(groupId),
			});
		};
	}, [groupId, storesSync, peerId]);

	return groupId ? peerId : null;
}

/** @internal test helper */
export function __resetSyncPeerSeq(): void {
	peerSeq = 0;
	resetSyncRegistry();
}
