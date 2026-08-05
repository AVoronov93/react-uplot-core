import { AxisSlotsDemo } from "@ruplot/examples/demos/axis-slots";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Axis slots",
	component: AxisSlotsDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("axis-slots"),
} satisfies Meta<typeof AxisSlotsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
