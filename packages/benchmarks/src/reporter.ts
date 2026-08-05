import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FullConfig, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";
import type { BenchReport, CompetitorId, ScenarioId } from "../harness/shared/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.resolve(__dirname, "../results");

const SCENARIOS: ScenarioId[] = ["mount", "update", "stream-60", "resize", "zoom", "cursor"];
const ORDER: CompetitorId[] = ["baseline", "uplot-react", "react-uplot", "ruplot"];

function fmtMs(n: number | undefined): string {
	if (n == null || Number.isNaN(n)) return "—";
	return `${n.toFixed(2)}ms`;
}

function fmtFps(n: number | undefined): string {
	if (n == null || Number.isNaN(n)) return "—";
	return n.toFixed(1);
}

function buildMarkdown(report: BenchReport): string {
	const byId = new Map(report.competitors.map((c) => [c.id, c]));

	const metricRows: Array<{
		label: string;
		pick: (id: CompetitorId) => string;
	}> = [
		{
			label: "mount p50",
			pick: (id) => fmtMs(byId.get(id)?.scenarios.find((s) => s.scenario === "mount")?.p50Ms),
		},
		{
			label: "mount p95",
			pick: (id) => fmtMs(byId.get(id)?.scenarios.find((s) => s.scenario === "mount")?.p95Ms),
		},
		{
			label: "update p50",
			pick: (id) => fmtMs(byId.get(id)?.scenarios.find((s) => s.scenario === "update")?.p50Ms),
		},
		{
			label: "stream-60 FPS",
			pick: (id) => fmtFps(byId.get(id)?.scenarios.find((s) => s.scenario === "stream-60")?.fps),
		},
		{
			label: "stream React commits",
			pick: (id) =>
				String(
					byId.get(id)?.scenarios.find((s) => s.scenario === "stream-60")?.reactCommits ?? "—",
				),
		},
		{
			label: "resize p50",
			pick: (id) => fmtMs(byId.get(id)?.scenarios.find((s) => s.scenario === "resize")?.p50Ms),
		},
		{
			label: "zoom p50",
			pick: (id) => fmtMs(byId.get(id)?.scenarios.find((s) => s.scenario === "zoom")?.p50Ms),
		},
		{
			label: "cursor p50",
			pick: (id) => fmtMs(byId.get(id)?.scenarios.find((s) => s.scenario === "cursor")?.p50Ms),
		},
	];

	const header = `| Metric | ${ORDER.join(" | ")} |`;
	const sep = `| --- | ${ORDER.map(() => "---").join(" | ")} |`;
	const rows = metricRows.map((row) => `| ${row.label} | ${ORDER.map(row.pick).join(" | ")} |`);

	return `# Benchmark results

Generated: ${report.generatedAt}

**Environment:** \`${report.environment.userAgent}\`  
**Config:** ${report.config.points} points · warmup ${report.config.warmup} · measured ${report.config.measured} · stream ${report.config.streamDurationMs}ms

${header}
${sep}
${rows.join("\n")}

> Hard gate: compared to [\`baseline.json\`](./baseline.json) — ruplot stream commits ≤5, FPS ≥50, p95 ≤ reference × 1.10. Override with \`BENCH_SOFT_GATE=1\`.
`;
}

class BenchReporter implements Reporter {
	private report: BenchReport | null = null;

	onBegin(_config: FullConfig, _suite: Suite) {}

	onTestEnd(test: TestCase, result: TestResult) {
		const annotation = [...test.annotations, ...result.annotations].find(
			(a) => a.type === "bench-report",
		);
		if (annotation?.description) {
			this.report = JSON.parse(annotation.description) as BenchReport;
		}

		for (const attachment of result.attachments) {
			if (attachment.name === "bench-report" && attachment.body) {
				this.report = JSON.parse(attachment.body.toString("utf8")) as BenchReport;
			}
		}
	}

	async onEnd() {
		if (!this.report) {
			console.warn("[bench reporter] no report attached");
			return;
		}

		await mkdir(resultsDir, { recursive: true });
		const jsonPath = path.join(resultsDir, "latest.json");
		const mdPath = path.join(resultsDir, "latest.md");
		await writeFile(jsonPath, `${JSON.stringify(this.report, null, 2)}\n`);
		await writeFile(mdPath, buildMarkdown(this.report));
		console.log(`[bench reporter] wrote ${jsonPath}`);
		console.log(`[bench reporter] wrote ${mdPath}`);

		// Validate scenarios present for portfolio output completeness
		for (const competitor of this.report.competitors) {
			for (const scenario of SCENARIOS) {
				if (!competitor.scenarios.some((s) => s.scenario === scenario)) {
					console.warn(`[bench reporter] missing ${competitor.id}/${scenario}`);
				}
			}
		}
	}
}

export default BenchReporter;
