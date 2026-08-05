/**
 * Process-wide sync group registry.
 *
 * WHY: Apps that call uPlot.sync ad-hoc leak peers on recreate/fullscreen key
 * changes. The registry tracks membership so React can join/leave cleanly.
 */
export type SyncPeer = {
	id: string;
	/** Called when the group key is rebound (e.g. fullscreen). */
	onRebind?: (groupId: string) => void;
};

export type SyncGroupState = {
	id: string;
	/** Key passed to uPlot cursor.sync.key */
	key: string;
	peers: readonly SyncPeer[];
};

type GroupRecord = {
	key: string;
	peers: Map<string, SyncPeer>;
	listeners: Set<() => void>;
	/** Cached for useSyncExternalStore — stable until membership changes. */
	peerIdsCache: readonly string[];
};

const groups = new Map<string, GroupRecord>();

function ensureGroup(groupId: string): GroupRecord {
	let group = groups.get(groupId);
	if (!group) {
		group = {
			key: groupId,
			peers: new Map(),
			listeners: new Set(),
			peerIdsCache: EMPTY_PEER_IDS,
		};
		groups.set(groupId, group);
	}
	return group;
}

function refreshPeerIdsCache(group: GroupRecord): void {
	group.peerIdsCache = group.peers.size === 0 ? EMPTY_PEER_IDS : [...group.peers.keys()];
}

function notify(group: GroupRecord): void {
	refreshPeerIdsCache(group);
	for (const listener of group.listeners) {
		listener();
	}
}

const EMPTY_PEER_IDS: readonly string[] = [];


export function joinSyncGroup(groupId: string, peer: SyncPeer): () => void {
	const group = ensureGroup(groupId);
	group.peers.set(peer.id, peer);
	notify(group);
	return () => {
		const g = groups.get(groupId);
		if (!g) return;
		g.peers.delete(peer.id);
		notify(g);
		if (g.peers.size === 0 && g.listeners.size === 0) {
			groups.delete(groupId);
		}
	};
}

export function subscribeSyncGroup(groupId: string, listener: () => void): () => void {
	const group = ensureGroup(groupId);
	group.listeners.add(listener);
	return () => {
		group.listeners.delete(listener);
		if (group.peers.size === 0 && group.listeners.size === 0) {
			groups.delete(groupId);
		}
	};
}

export function getSyncGroup(groupId: string): SyncGroupState | null {
	const group = groups.get(groupId);
	if (!group) return null;
	return {
		id: groupId,
		key: group.key,
		peers: [...group.peers.values()],
	};
}

export function listSyncPeerIds(groupId: string): readonly string[] {
	const group = groups.get(groupId);
	if (!group) return EMPTY_PEER_IDS;
	return group.peerIdsCache;
}

/**
 * Rebind the uPlot sync key for a logical group (fullscreen / layout swap).
 * Peers receive onRebind so hosts can patch cursor.sync without inventing keys.
 */
export function rebindSyncGroup(groupId: string, nextKey: string): void {
	const group = ensureGroup(groupId);
	group.key = nextKey;
	for (const peer of group.peers.values()) {
		peer.onRebind?.(groupId);
	}
	notify(group);
}

/** Test helper — clear all groups. */
export function resetSyncRegistry(): void {
	groups.clear();
}
