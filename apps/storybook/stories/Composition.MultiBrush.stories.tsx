import { MultiBrushDemo } from "@ruplot/examples/demos/multi-brush";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "04 Composition/Multi brush",
	component: MultiBrushDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("multi-brush"),
} satisfies Meta<typeof MultiBrushDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
