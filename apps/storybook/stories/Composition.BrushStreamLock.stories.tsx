import { BrushStreamLockDemo } from "@ruplot/examples/demos/brush-stream-lock";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "04 Composition/Brush stream lock",
	component: BrushStreamLockDemo,
	args: { chrome: false, inspect: false },
	argTypes: {
		...hideChrome,
		inspect: { control: "boolean", name: "start in inspect mode" },
	},
	parameters: demoDocs("brush-stream-lock"),
} satisfies Meta<typeof BrushStreamLockDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
