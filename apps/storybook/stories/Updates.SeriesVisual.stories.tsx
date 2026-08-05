import { SeriesVisualDemo } from "@ruplot/examples/demos/series-visual";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Series visual",
	component: SeriesVisualDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("series-visual"),
} satisfies Meta<typeof SeriesVisualDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
