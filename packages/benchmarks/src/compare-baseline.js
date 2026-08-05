/**
 * Compare a BenchReport against committed baseline.json thresholds.
 */

/**
 * @typedef {object} BaselinePolicy
 * @property {number} p95MaxRatio
 * @property {number} fpsMinRatio
 * @property {string[]} [skipScenarios]
 * @property {Record<string, Record<string, { reactCommitsMax?: number, fpsMin?: number, p95MsMax?: number }>>} [absolute]
 */

/**
 * @typedef {object} BaselineFile
 * @property {number} version
 * @property {BaselinePolicy} policy
 * @property {Record<string, Record<string, { p95Ms?: number, fps?: number, reactCommits?: number }>>} reference
 */

/**
 * @typedef {object} Violation
 * @property {string} competitor
 * @property {string} scenario
 * @property {string} metric
 * @property {number} actual
 * @property {number} limit
 * @property {string} message
 */

/**
 * @param {{ competitors: Array<{ id: string, scenarios: Array<{ scenario: string, p95Ms: number, fps?: number, reactCommits: number }> }> }} report
 * @param {BaselineFile} baseline
 */
export function compareToBaseline(report, baseline) {
	/** @type {Violation[]} */
	const violations = [];
	const skip = new Set(baseline.policy.skipScenarios ?? []);
	const { p95MaxRatio, fpsMinRatio, absolute = {} } = baseline.policy;

	for (const competitor of report.competitors) {
		const refCompetitor = baseline.reference[competitor.id];
		const absCompetitor = absolute[competitor.id];

		for (const scenario of competitor.scenarios) {
			if (skip.has(scenario.scenario)) continue;

			const abs = absCompetitor?.[scenario.scenario];
			if (abs?.reactCommitsMax != null && scenario.reactCommits > abs.reactCommitsMax) {
				violations.push({
					competitor: competitor.id,
					scenario: scenario.scenario,
					metric: "reactCommits",
					actual: scenario.reactCommits,
					limit: abs.reactCommitsMax,
					message: `${competitor.id}/${scenario.scenario} reactCommits ${scenario.reactCommits} > max ${abs.reactCommitsMax}`,
				});
			}
			if (abs?.fpsMin != null && scenario.fps != null && scenario.fps < abs.fpsMin) {
				violations.push({
					competitor: competitor.id,
					scenario: scenario.scenario,
					metric: "fps",
					actual: scenario.fps,
					limit: abs.fpsMin,
					message: `${competitor.id}/${scenario.scenario} fps ${scenario.fps.toFixed(1)} < min ${abs.fpsMin}`,
				});
			}
			if (abs?.p95MsMax != null && scenario.p95Ms > abs.p95MsMax) {
				violations.push({
					competitor: competitor.id,
					scenario: scenario.scenario,
					metric: "p95Ms",
					actual: scenario.p95Ms,
					limit: abs.p95MsMax,
					message: `${competitor.id}/${scenario.scenario} p95 ${scenario.p95Ms.toFixed(2)}ms > max ${abs.p95MsMax}ms`,
				});
			}

			const ref = refCompetitor?.[scenario.scenario];
			if (!ref) continue;

			if (ref.p95Ms != null && scenario.p95Ms > ref.p95Ms * p95MaxRatio) {
				const limit = ref.p95Ms * p95MaxRatio;
				violations.push({
					competitor: competitor.id,
					scenario: scenario.scenario,
					metric: "p95Ms",
					actual: scenario.p95Ms,
					limit,
					message: `${competitor.id}/${scenario.scenario} p95 ${scenario.p95Ms.toFixed(2)}ms > baseline ${ref.p95Ms}ms × ${p95MaxRatio} (=${limit.toFixed(2)}ms)`,
				});
			}

			if (ref.fps != null && scenario.fps != null && scenario.fps < ref.fps * fpsMinRatio) {
				const limit = ref.fps * fpsMinRatio;
				violations.push({
					competitor: competitor.id,
					scenario: scenario.scenario,
					metric: "fps",
					actual: scenario.fps,
					limit,
					message: `${competitor.id}/${scenario.scenario} fps ${scenario.fps.toFixed(1)} < baseline ${ref.fps} × ${fpsMinRatio} (=${limit.toFixed(1)})`,
				});
			}
		}
	}

	return { ok: violations.length === 0, violations };
}
