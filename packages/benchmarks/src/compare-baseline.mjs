import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareToBaseline } from "./compare-baseline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.resolve(__dirname, "../results");

const soft = process.env.BENCH_SOFT_GATE === "1";

async function main() {
	const latestPath = path.join(resultsDir, "latest.json");
	const baselinePath = path.join(resultsDir, "baseline.json");

	let latestRaw;
	let baselineRaw;
	try {
		latestRaw = await readFile(latestPath, "utf8");
		baselineRaw = await readFile(baselinePath, "utf8");
	} catch (err) {
		console.error("[bench compare] missing latest.json or baseline.json", err);
		process.exit(soft ? 0 : 1);
		return;
	}

	const report = JSON.parse(latestRaw);
	const baseline = JSON.parse(baselineRaw);
	const result = compareToBaseline(report, baseline);

	if (result.ok) {
		console.log("[bench compare] PASS — within baseline thresholds");
		process.exit(0);
		return;
	}

	console.error("[bench compare] FAIL — regressions vs baseline.json:");
	for (const v of result.violations) {
		console.error(`  • ${v.message}`);
	}

	if (soft) {
		console.warn("[bench compare] BENCH_SOFT_GATE=1 — not failing the process");
		process.exit(0);
		return;
	}

	process.exit(1);
}

main();
