import type { ClassifyResult, OptionChangeKind } from "./classifier.js";
import type { ChartCommand } from "./commands.js";

export type SessionCommandStats = {
	recreate: number;
	setData: number;
	setSize: number;
	setScale: number;
	setSeries: number;
	patchSeries: number;
	setCursor: number;
	setSelect: number;
	batch: number;
};

export type SessionDebugSnapshot = {
	stats: SessionCommandStats;
	lastKind: OptionChangeKind | null;
	lastReasons: readonly string[];
	/** Last applied top-level commands (batch children flattened in counts only). */
	lastApplied: readonly ChartCommand[];
};

export function createEmptyCommandStats(): SessionCommandStats {
	return {
		recreate: 0,
		setData: 0,
		setSize: 0,
		setScale: 0,
		setSeries: 0,
		patchSeries: 0,
		setCursor: 0,
		setSelect: 0,
		batch: 0,
	};
}

export function tallyCommands(stats: SessionCommandStats, commands: readonly ChartCommand[]): void {
	for (const command of commands) {
		stats[command.type] += 1;
		if (command.type === "batch") {
			tallyCommands(stats, command.commands);
		}
	}
}

export type SessionDebugController = {
	enabled: boolean;
	log: boolean;
	snapshot: SessionDebugSnapshot;
	recordApply: (result: {
		kind: OptionChangeKind | null;
		reasons: readonly string[];
		applied: readonly ChartCommand[];
	}) => void;
	getSnapshot: () => SessionDebugSnapshot;
	resetStats: () => void;
};

export function createSessionDebugController(): SessionDebugController {
	const snapshot: SessionDebugSnapshot = {
		stats: createEmptyCommandStats(),
		lastKind: null,
		lastReasons: [],
		lastApplied: [],
	};

	const controller: SessionDebugController = {
		enabled: false,
		log: false,
		snapshot,
		recordApply({ kind, reasons, applied }) {
			tallyCommands(snapshot.stats, applied);
			snapshot.lastKind = kind;
			snapshot.lastReasons = reasons;
			snapshot.lastApplied = applied;

			if (!controller.enabled || !controller.log) return;
			if (kind === "recreate" || reasons.length > 0) {
				console.info(
					"[ruplot]",
					kind ?? "apply",
					reasons.length ? reasons : applied.map((c) => c.type),
				);
			} else if (applied.length > 0) {
				console.debug(
					"[ruplot]",
					kind,
					applied.map((c) => c.type),
				);
			}
		},
		getSnapshot() {
			return {
				stats: { ...snapshot.stats },
				lastKind: snapshot.lastKind,
				lastReasons: [...snapshot.lastReasons],
				lastApplied: snapshot.lastApplied,
			};
		},
		resetStats() {
			snapshot.stats = createEmptyCommandStats();
			snapshot.lastKind = null;
			snapshot.lastReasons = [];
			snapshot.lastApplied = [];
		},
	};

	return controller;
}

/** Optional hook when Chart finishes a classify → apply turn. */
export type ChartDebugConfig = {
	/** Console log recreate/reasons (default true when `debug={true}`). */
	log?: boolean;
	onClassify?: (result: ClassifyResult) => void;
};
