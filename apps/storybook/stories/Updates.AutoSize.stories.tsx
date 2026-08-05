import { AutoSizeDemo } from "@ruplot/examples/demos/auto-size";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/AutoSize",
	component: AutoSizeDemo,
	args: { chrome: false, minWidth: 320, minHeight: 180 },
	argTypes: {
		...hideChrome,
		minWidth: { control: { type: "number", min: 200, max: 600, step: 10 } },
		minHeight: { control: { type: "number", min: 120, max: 400, step: 10 } },
	},
	parameters: demoDocs("auto-size"),
} satisfies Meta<typeof AutoSizeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
