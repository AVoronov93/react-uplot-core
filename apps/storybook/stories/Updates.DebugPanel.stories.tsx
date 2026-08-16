import { DebugPanelDemo } from "@ruplot/examples/demos/debug-panel";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Debug panel",
	component: DebugPanelDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("debug-panel"),
} satisfies Meta<typeof DebugPanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
