import { HooksDemo } from "@ruplot/examples/demos/hooks";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "02 Getting started/Hooks",
	component: HooksDemo,
	args: {
		chrome: false,
		width: 720,
		height: 260,
		stroke: "#0ea5e9",
		points: 60,
	},
	argTypes: {
		...hideChrome,
		stroke: { control: "color" },
		width: { control: { type: "number", min: 320, max: 1000, step: 10 } },
		height: { control: { type: "number", min: 120, max: 480, step: 10 } },
		points: { control: { type: "number", min: 20, max: 200, step: 5 } },
	},
	parameters: demoDocs("hooks"),
} satisfies Meta<typeof HooksDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
