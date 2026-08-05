import { type Store, createStore } from "./store.js";

export type CursorSnapshot = {
	idx: number | null;
	/** Per-series hover indices from uPlot (when available). */
	idxs: readonly (number | null)[] | null;
	left: number;
	top: number;
};

export type ScaleRange = {
	min: number | null;
	max: number | null;
};

export type ScalesSnapshot = Record<string, ScaleRange>;

export type SelectSnapshot = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type SeriesVisibilitySnapshot = {
	show: readonly boolean[];
	focus: readonly (boolean | undefined)[];
};

export type SyncSnapshot = {
	group: string | null;
	peerIds: readonly string[];
};

export type MetaSnapshot = {
	ready: boolean;
	version: number;
};

export type ChartStores = {
	cursor: Store<CursorSnapshot>;
	scales: Store<ScalesSnapshot>;
	selection: Store<SelectSnapshot>;
	series: Store<SeriesVisibilitySnapshot>;
	sync: Store<SyncSnapshot>;
	meta: Store<MetaSnapshot>;
};

const EMPTY_CURSOR: CursorSnapshot = { idx: null, idxs: null, left: -10, top: -10 };
const EMPTY_SELECT: SelectSnapshot = { left: 0, top: 0, width: 0, height: 0 };
const EMPTY_SERIES: SeriesVisibilitySnapshot = { show: [], focus: [] };
const EMPTY_SYNC: SyncSnapshot = { group: null, peerIds: [] };
const EMPTY_META: MetaSnapshot = { ready: false, version: 0 };

export function createChartStores(): ChartStores {
	return {
		cursor: createStore(EMPTY_CURSOR, EMPTY_CURSOR),
		scales: createStore<ScalesSnapshot>({}, {}),
		selection: createStore(EMPTY_SELECT, EMPTY_SELECT),
		series: createStore(EMPTY_SERIES, EMPTY_SERIES),
		sync: createStore(EMPTY_SYNC, EMPTY_SYNC),
		meta: createStore(EMPTY_META, EMPTY_META),
	};
}
