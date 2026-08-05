import { describe, expect, it } from "vitest";
import { compareToBaseline } from "./compare-baseline.js";

const baseline = {
	version: 1,
	policy: {
		p95MaxRatio: 1.1,
		fpsMinRatio: 0.9,
		skipScenarios: ["cursor"],
		absolute: {
			ruplot: {
				"stream-60": { reactCommitsMax: 5, fpsMin: 50 },
			},
		},
	},
	reference: {
		ruplot: {
			mount: { p95Ms: 100 },
			"stream-60": { fps: 55, reactCommits: 0 },
		},
	},
};

describe("compareToBaseline", () => {
	it("passes clean ruplot stream", () => {
		const result = compareToBaseline(
			{
				competitors: [
					{
						id: "ruplot",
						scenarios: [
							{ scenario: "mount", p95Ms: 40, reactCommits: 1 },
							{ scenario: "stream-60", p95Ms: 2000, reactCommits: 0, fps: 59 },
							{ scenario: "cursor", p95Ms: 1, reactCommits: 0 },
						],
					},
				],
			},
			baseline,
		);
		expect(result.ok).toBe(true);
	});

	it("fails on stream React commits", () => {
		const result = compareToBaseline(
			{
				competitors: [
					{
						id: "ruplot",
						scenarios: [{ scenario: "stream-60", p95Ms: 2000, reactCommits: 20, fps: 59 }],
					},
				],
			},
			baseline,
		);
		expect(result.ok).toBe(false);
		expect(result.violations.some((v) => v.metric === "reactCommits")).toBe(true);
	});

	it("fails on p95 regression beyond ratio", () => {
		const result = compareToBaseline(
			{
				competitors: [
					{
						id: "ruplot",
						scenarios: [{ scenario: "mount", p95Ms: 150, reactCommits: 0 }],
					},
				],
			},
			baseline,
		);
		expect(result.ok).toBe(false);
		expect(result.violations[0]?.metric).toBe("p95Ms");
	});

	it("ignores competitors without reference", () => {
		const result = compareToBaseline(
			{
				competitors: [
					{
						id: "uplot-react",
						scenarios: [{ scenario: "stream-60", p95Ms: 2000, reactCommits: 119, fps: 59 }],
					},
				],
			},
			baseline,
		);
		expect(result.ok).toBe(true);
	});
});
