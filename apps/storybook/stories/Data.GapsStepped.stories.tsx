import { GapsSteppedDemo } from "@ruplot/examples/demos/gaps-stepped";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "05 Data/Gaps stepped",
	component: GapsSteppedDemo,
	args: { chrome: false, holdForward: true },
	argTypes: {
		...hideChrome,
		holdForward: { control: "boolean" },
	},
	parameters: demoDocs("gaps-stepped"),
} satisfies Meta<typeof GapsSteppedDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
