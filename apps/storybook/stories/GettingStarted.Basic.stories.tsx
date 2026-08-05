import { BasicDemo } from "@ruplot/examples/demos/basic";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "02 Getting started/Basic",
	component: BasicDemo,
	args: {
		chrome: false,
		width: 720,
		height: 260,
		title: "Basic mount",
		stroke: "#0ea5e9",
		points: 40,
		lineWidth: 2,
	},
	argTypes: {
		...hideChrome,
		stroke: { control: "color" },
		width: { control: { type: "number", min: 320, max: 1000, step: 10 } },
		height: { control: { type: "number", min: 120, max: 480, step: 10 } },
		points: { control: { type: "number", min: 10, max: 500, step: 5 } },
		lineWidth: { control: { type: "number", min: 1, max: 6, step: 0.5 } },
	},
	parameters: demoDocs("basic"),
} satisfies Meta<typeof BasicDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
