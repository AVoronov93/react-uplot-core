import { getDemo } from "@ruplot/examples/demos/registry";

/**
 * Docs-first blurb for catalog-backed demos.
 *
 * Storybook 8 `source.type: "code"` means “static CSF snippet”
 * (`<XxxDemo chrome={false} />`) — not “use this string”. Custom copy-paste
 * lives in `source.code` + `transform` / `transformSource`.
 */
export function demoDocs(id: string, extra?: { story?: string }) {
	const demo = getDemo(id);
	if (!demo) {
		throw new Error(`Unknown demo id "${id}" — add it to the examples registry`);
	}
	const pitfalls =
		demo.pitfalls.length > 0
			? `\n\n### Pitfalls\n${demo.pitfalls.map((p) => `- ${p}`).join("\n")}`
			: "";

	const code = demo.pattern;

	return {
		docs: {
			description: {
				component: `**${demo.blurb}**\n\n### Why ruplot\n${demo.why}${pitfalls}`,
				...(extra?.story ? { story: extra.story } : {}),
			},
			canvas: {
				sourceState: "hidden" as const,
			},
			source: {
				language: "tsx" as const,
				code,
				transform: () => code,
			},
			transformSource: () => code,
		},
	};
}

/** Hide chrome from Controls; keep other args interactive. */
export const hideChrome = {
	chrome: { table: { disable: true }, control: false },
} as const;

/** Prefer literal `tags: ["!dev"]` in CSF — Storybook indexer rejects imported tag arrays. */
export const docsOnlyStory: string[] = ["!dev"];
