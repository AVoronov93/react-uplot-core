import { type Page, expect, test } from "@playwright/test";
import type {
	BenchReport,
	CompetitorId,
	CompetitorReport,
	ScenarioResult,
} from "../harness/shared/types";

const COMPETITORS: CompetitorId[] = ["baseline", "uplot-react", "react-uplot", "ruplot"];
const WARMUP = 3;
const MEASURED = 12;
const STREAM_MS = 2_000;

async function getApi(page: Page) {
	await page.waitForFunction(() => window.__RUPLOT_BENCH__?.ready === true);
	return page.evaluateHandle(() => window.__RUPLOT_BENCH__!);
}

test.describe.configure({ mode: "serial" });

test("competitor matrix", async ({ page }, testInfo) => {
	await page.goto("/");
	await getApi(page);

	const competitors: CompetitorReport[] = [];

	for (const id of COMPETITORS) {
		await page.evaluate(async (competitorId) => {
			await window.__RUPLOT_BENCH__!.setCompetitor(competitorId);
		}, id);

		// Warmup mount/update (discarded)
		await page.evaluate(
			async ({ warmup }) => {
				const api = window.__RUPLOT_BENCH__!;
				await api.runMount(warmup);
				await api.runUpdate(warmup);
			},
			{ warmup: WARMUP },
		);

		await page.evaluate(() => window.__RUPLOT_BENCH__!.resetReactCommits());

		const mount = await page.evaluate(async (measured) => {
			return window.__RUPLOT_BENCH__!.runMount(measured);
		}, MEASURED);

		const update = await page.evaluate(async (measured) => {
			return window.__RUPLOT_BENCH__!.runUpdate(measured);
		}, MEASURED);

		const stream = await page.evaluate(async (durationMs) => {
			return window.__RUPLOT_BENCH__!.runStream(60, durationMs);
		}, STREAM_MS);

		const resize = await page.evaluate(async (measured) => {
			return window.__RUPLOT_BENCH__!.runResize(measured);
		}, MEASURED);

		const zoom = await page.evaluate(async (measured) => {
			return window.__RUPLOT_BENCH__!.runZoom(measured);
		}, MEASURED);

		const cursor = await page.evaluate(async (measured) => {
			return window.__RUPLOT_BENCH__!.runCursor(measured);
		}, MEASURED);

		const scenarios: ScenarioResult[] = [mount, update, stream, resize, zoom, cursor];
		for (const s of scenarios) {
			expect(s.p50Ms, `${id}/${s.scenario} p50`).toBeGreaterThanOrEqual(0);
		}

		competitors.push({ id, scenarios });
	}

	const report: BenchReport = {
		status: "ok",
		generatedAt: new Date().toISOString(),
		environment: {
			userAgent: await page.evaluate(() => navigator.userAgent),
			viewport: page.viewportSize() ?? { width: 1280, height: 720 },
		},
		config: {
			points: 2000,
			warmup: WARMUP,
			measured: MEASURED,
			streamDurationMs: STREAM_MS,
		},
		competitors,
	};

	await testInfo.attach("bench-report", {
		body: JSON.stringify(report, null, 2),
		contentType: "application/json",
	});

	// Stash for custom reporter via env annotation
	testInfo.annotations.push({
		type: "bench-report",
		description: JSON.stringify(report),
	});
});
