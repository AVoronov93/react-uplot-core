import { LegendDemo } from "@ruplot/examples/demos/legend";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "04 Composition/Legend",
	component: LegendDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("legend"),
} satisfies Meta<typeof LegendDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
