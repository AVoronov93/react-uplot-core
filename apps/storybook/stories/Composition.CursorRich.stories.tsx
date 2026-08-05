import { CursorRichDemo } from "@ruplot/examples/demos/cursor-rich";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "04 Composition/Per-series cursor",
	component: CursorRichDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("cursor-rich"),
} satisfies Meta<typeof CursorRichDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
