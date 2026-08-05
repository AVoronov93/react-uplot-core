import { DualDataDemo } from "@ruplot/examples/demos/dual-data";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "05 Data/Dual data",
	component: DualDataDemo,
	args: { chrome: false, stroke: "#0ea5e9" },
	argTypes: {
		...hideChrome,
		stroke: { control: "color" },
	},
	parameters: demoDocs("dual-data"),
} satisfies Meta<typeof DualDataDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
