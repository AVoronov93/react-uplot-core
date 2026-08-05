import { DEMOS, demosByCategory } from "@ruplot/examples/demos/registry";
import type { Meta, StoryObj } from "@storybook/react";

function Catalog() {
	const groups = demosByCategory();
	return (
		<article style={{ maxWidth: 720, fontFamily: "system-ui", lineHeight: 1.45 }}>
			<h1 style={{ marginTop: 0 }}>ruplot demos</h1>
			<p>
				Same catalog as <code>pnpm dev</code>. Each sidebar entry opens a <strong>Demo</strong> docs
				page (live example + controls + notes). Full API: <strong>01 Overview → API</strong>.
			</p>
			{groups.map(({ category, demos }) => (
				<section key={category}>
					<h2>{category}</h2>
					<ul>
						{demos.map((d) => (
							<li key={d.id}>
								<strong>{d.title}</strong> — {d.blurb}
							</li>
						))}
					</ul>
				</section>
			))}
			<p style={{ color: "#64748b", fontSize: 14 }}>{DEMOS.length} scenes</p>
		</article>
	);
}

const meta = {
	title: "01 Overview/Catalog",
	component: Catalog,
	parameters: {
		layout: "padded",
		controls: { disable: true },
		docs: {
			description: {
				component: "Index of interactive demos mirrored from the examples app.",
			},
		},
	},
} satisfies Meta<typeof Catalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Index: Story = {
	tags: ["!dev"],
};
