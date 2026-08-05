import { ThresholdDemo } from "@ruplot/examples/demos/threshold";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "06 Plugins/Threshold",
	component: ThresholdDemo,
	args: {
		chrome: false,
		y: 25,
		thresholdStroke: "#f97316",
		seriesStroke: "#0ea5e9",
	},
	argTypes: {
		...hideChrome,
		y: { control: { type: "number", min: 0, max: 50, step: 1 } },
		thresholdStroke: { control: "color" },
		seriesStroke: { control: "color" },
	},
	parameters: demoDocs("threshold"),
} satisfies Meta<typeof ThresholdDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
