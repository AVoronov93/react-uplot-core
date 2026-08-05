import type { Preview } from "@storybook/react";
import {
	Controls,
	Description,
	Primary,
	Stories,
	Subtitle,
	Title,
} from "@storybook/blocks";
import "uplot/dist/uPlot.min.css";
import "../../../packages/examples/src/styles.css";
import "./preview.css";

/**
 * Docs-first page: description + live demo + controls.
 * CSF stories use `tags: ['!dev']` so the sidebar leaf is this docs page
 * (labeled "Demo"), not a nested Docs/Playground pair.
 *
 * Real library usage comes from `demoDocs()` → `parameters.docs.source.code`
 * (not the Storybook `<XxxDemo />` wrapper).
 */
function DemoDocsPage() {
	return (
		<>
			<Title />
			<Subtitle />
			<Description />
			<Primary />
			<Controls />
			<Stories includePrimary={false} />
		</>
	);
}

const preview: Preview = {
	tags: ["autodocs"],
	parameters: {
		viewMode: "docs",
		layout: "padded",
		controls: {
			matchers: { color: /(background|color|stroke)$/i },
			expanded: true,
		},
		backgrounds: {
			default: "mist",
			values: [
				{ name: "mist", value: "#eef3f8" },
				{ name: "white", value: "#ffffff" },
			],
		},
		options: {
			storySort: {
				order: [
					"01 Overview",
					"02 Getting started",
					"03 Updates",
					"04 Composition",
					"05 Data",
					"06 Plugins",
					"07 Compare",
				],
			},
		},
		docs: {
			toc: true,
			page: DemoDocsPage,
			defaultName: "Demo",
		},
	},
};

export default preview;
