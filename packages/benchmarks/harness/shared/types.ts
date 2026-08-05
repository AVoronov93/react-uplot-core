export type CompetitorId = "baseline" | "uplot-react" | "react-uplot" | "ruplot";

export type ScenarioId = "mount" | "update" | "stream-60" | "resize" | "zoom" | "cursor";

export type ScenarioResult = {
	scenario: ScenarioId;
	samplesMs: number[];
	p50Ms: number;
	p95Ms: number;
	fps?: number;
	reactCommits: number;
	heapDeltaMb?: number;
};

export type CompetitorReport = {
	id: CompetitorId;
	scenarios: ScenarioResult[];
};

export type BenchReport = {
	status: "ok" | "pending" | "error";
	generatedAt: string;
	environment: {
		userAgent: string;
		viewport: { width: number; height: number };
	};
	config: {
		points: number;
		warmup: number;
		measured: number;
		streamDurationMs: number;
	};
	competitors: CompetitorReport[];
};

declare global {
	interface Window {
		__RUPLOT_BENCH__?: BenchApi;
	}
}

export type BenchApi = {
	ready: boolean;
	setCompetitor: (id: CompetitorId) => Promise<void>;
	runMount: (runs: number) => Promise<ScenarioResult>;
	runUpdate: (runs: number) => Promise<ScenarioResult>;
	runStream: (hz: number, durationMs: number) => Promise<ScenarioResult>;
	runResize: (runs: number) => Promise<ScenarioResult>;
	runZoom: (runs: number) => Promise<ScenarioResult>;
	runCursor: (runs: number) => Promise<ScenarioResult>;
	getReactCommits: () => number;
	resetReactCommits: () => void;
	getHeapMb: () => number | null;
};

export function percentile(sorted: number[], p: number): number {
	if (sorted.length === 0) return 0;
	const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
	return sorted[Math.max(0, idx)]!;
}

export function summarize(
	scenario: ScenarioId,
	samplesMs: number[],
	extra: Partial<ScenarioResult> = {},
): ScenarioResult {
	const sorted = [...samplesMs].sort((a, b) => a - b);
	return {
		scenario,
		samplesMs,
		p50Ms: percentile(sorted, 50),
		p95Ms: percentile(sorted, 95),
		reactCommits: 0,
		...extra,
	};
}
