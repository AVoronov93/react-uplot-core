import { getDemo } from "@ruplot/examples/demos/registry";

/**
 * Docs-first blurb for catalog-backed demos.
 * Replaces Storybook's useless `<FooDemo …/>` source with the real library usage snippet.
 */
export function demoDocs(id: string) {
	const demo = getDemo(id)!;
	const pitfalls =
		demo.pitfalls.length > 0
			? `\n\n### Pitfalls\n${demo.pitfalls.map((p) => `- ${p}`).join("\n")}`
			: "";

	const code = `// Copy into your app — not the Storybook demo wrapper
${demo.pattern}`;

	return {
		docs: {
			description: {
				component: `**${demo.blurb}**\n\n### Why ruplot\n${demo.why}${pitfalls}`,
			},
			canvas: {
				sourceState: "shown" as const,
			},
			source: {
				type: "code" as const,
				language: "tsx",
				code,
			},
		},
	};
}

/** Hide chrome from Controls; keep other args interactive. */
export const hideChrome = {
	chrome: { table: { disable: true }, control: false },
} as const;

/** Prefer literal `tags: ["!dev"]` in CSF — Storybook indexer rejects imported tag arrays. */
export const docsOnlyStory: string[] = ["!dev"];
