export type BaselinePolicy = {
	p95MaxRatio: number;
	fpsMinRatio: number;
	skipScenarios?: string[];
	absolute?: Record<
		string,
		Record<
			string,
			{
				reactCommitsMax?: number;
				fpsMin?: number;
				p95MsMax?: number;
			}
		>
	>;
};

export type BaselineFile = {
	version: number;
	policy: BaselinePolicy;
	reference: Record<
		string,
		Record<
			string,
			{
				p95Ms?: number;
				fps?: number;
				reactCommits?: number;
			}
		>
	>;
};

export type ScenarioLike = {
	scenario: string;
	p95Ms: number;
	fps?: number;
	reactCommits: number;
};

export type ReportLike = {
	competitors: Array<{
		id: string;
		scenarios: ScenarioLike[];
	}>;
};

export type Violation = {
	competitor: string;
	scenario: string;
	metric: string;
	actual: number;
	limit: number;
	message: string;
};

export type CompareResult = {
	ok: boolean;
	violations: Violation[];
};

export function compareToBaseline(report: ReportLike, baseline: BaselineFile): CompareResult;
